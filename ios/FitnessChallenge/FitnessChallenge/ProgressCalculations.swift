//
//  ProgressCalculations.swift
//  FitnessChallenge
//
//  Pure calculation helpers for progress, leaderboard, charts (no DummyData).
//

import Foundation

enum ProgressCalculations {

    private static let dateFormatterYYYYMMDD: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.timeZone = TimeZone.current
        return f
    }()

    private static let iso8601Formatter: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f
    }()

    /// Progress over time chart point.
    struct ChartPoint {
        let timestamp: String  // ISO 8601 for x-axis positioning
        let progressByUser: [String: Double] // userId -> 0...100
    }

    static func calculateUserProgress(userId: String, logs: [WorkoutLog], challenge: WeekChallenge, exercises: [StrengthExercise], displayName: String? = nil) -> UserProgress {
        let uid = userId.lowercased()
        let userLogs = logs.filter { $0.userId.lowercased() == uid }
        var cardioTotal: Double = 0
        var exerciseTotals: [String: Int] = [:]
        for log in userLogs {
            if log.logType == .cardio, let amt = log.cardioAmount { cardioTotal += amt }
            if log.logType == .strength, let exId = log.exerciseId, let reps = log.strengthReps { exerciseTotals[exId, default: 0] += reps }
        }
        let cardioProgress = challenge.cardioTarget > 0 ? min(cardioTotal / challenge.cardioTarget, 1.0) : 0
        var strengthProgress: Double = 0
        if !exercises.isEmpty {
            let perEx: [Double] = exercises.map { ex in
                let total = exerciseTotals[ex.id] ?? 0
                return Double(ex.targetReps) > 0 ? min(Double(total) / Double(ex.targetReps), 1.0) : 0
            }
            strengthProgress = perEx.reduce(0, +) / Double(perEx.count)
        }
        let totalProgress = (cardioProgress + strengthProgress) / 2
        return UserProgress(
            userId: userId,
            displayName: displayName ?? "You",
            cardioTotal: cardioTotal,
            cardioProgress: cardioProgress,
            strengthOverallProgress: strengthProgress,
            totalProgress: totalProgress,
            exerciseTotals: exerciseTotals
        )
    }

    static func userCardioBreakdown(userId: String, logs: [WorkoutLog]) -> [String: Double] {
        var out: [String: Double] = [:]
        let uid = userId.lowercased()
        for log in logs where log.userId.lowercased() == uid && log.logType == .cardio {
            guard let act = log.cardioActivity, let amt = log.cardioAmount else { continue }
            let name = act.rawValue.prefix(1).uppercased() + act.rawValue.dropFirst()
            out[name, default: 0] += amt
        }
        return out
    }

    static func groupCardioTotal(logs: [WorkoutLog], cardioTargetPerPerson: Double) -> Double {
        var userTotals: [String: Double] = [:]
        for log in logs where log.logType == .cardio {
            guard let amt = log.cardioAmount else { continue }
            userTotals[log.userId, default: 0] += amt
        }
        return userTotals.values.map { min($0, cardioTargetPerPerson) }.reduce(0, +)
    }

    static func groupCardioTarget(numberOfMembers: Int, cardioTargetPerPerson: Double) -> Double {
        cardioTargetPerPerson * Double(numberOfMembers)
    }

    static func groupCardioProgress(logs: [WorkoutLog], numberOfMembers: Int, cardioTargetPerPerson: Double) -> Double {
        let total = groupCardioTotal(logs: logs, cardioTargetPerPerson: cardioTargetPerPerson)
        let target = groupCardioTarget(numberOfMembers: numberOfMembers, cardioTargetPerPerson: cardioTargetPerPerson)
        return target > 0 ? min(total / target, 1) : 0
    }

    static func groupExerciseTotals(logs: [WorkoutLog], exercises: [StrengthExercise]) -> [String: Int] {
        var result: [String: Int] = [:]
        for ex in exercises {
            var userTotals: [String: Int] = [:]
            for log in logs where log.logType == .strength && log.exerciseId == ex.id {
                guard let reps = log.strengthReps else { continue }
                userTotals[log.userId, default: 0] += reps
            }
            result[ex.id] = userTotals.values.map { min($0, ex.targetReps) }.reduce(0, +)
        }
        return result
    }

    static func groupStrengthProgress(logs: [WorkoutLog], numberOfMembers: Int, exercises: [StrengthExercise]) -> Double {
        let totals = groupExerciseTotals(logs: logs, exercises: exercises)
        guard !exercises.isEmpty else { return 0 }
        let perEx: [Double] = exercises.map { ex in
            let total = totals[ex.id] ?? 0
            let target = ex.targetReps * numberOfMembers
            return target > 0 ? min(Double(total) / Double(target), 1) : 0
        }
        return perEx.reduce(0, +) / Double(perEx.count)
    }

    static func groupCardioBreakdown(logs: [WorkoutLog]) -> [String: Double] {
        var out: [String: Double] = [:]
        for log in logs where log.logType == .cardio {
            guard let act = log.cardioActivity, let amt = log.cardioAmount else { continue }
            let name = act.rawValue.prefix(1).uppercased() + act.rawValue.dropFirst()
            out[name, default: 0] += amt
        }
        return out
    }

    static func progressOverTime(logs: [WorkoutLog], weekStart: String, weekEnd: String, challenge: WeekChallenge, exercises: [StrengthExercise], memberIds: [String]) -> [ChartPoint] {
        let cal = Calendar.current
        let startStr = String(weekStart.prefix(10))
        let endStr = String(weekEnd.prefix(10))
        guard let startDay = dateFormatterYYYYMMDD.date(from: startStr), let endDay = dateFormatterYYYYMMDD.date(from: endStr) else { return [] }
        let weekStartDate = cal.startOfDay(for: startDay)
        let weekEndDate = cal.date(bySettingHour: 23, minute: 59, second: 59, of: endDay) ?? endDay
        let now = Date()

        func effectiveTimestamp(for log: WorkoutLog) -> Date? {
            if let created = log.createdAt, let d = iso8601Formatter.date(from: created) {
                return d
            }
            if let created = log.createdAt {
                let fallback = DateFormatter()
                fallback.dateFormat = "yyyy-MM-dd'T'HH:mm:ss"
                fallback.timeZone = TimeZone(identifier: "UTC")
                if let d = fallback.date(from: String(created.prefix(19))) { return d }
            }
            guard let d = dateFormatterYYYYMMDD.date(from: String(log.loggedAt.prefix(10))) else { return nil }
            return cal.date(bySettingHour: 12, minute: 0, second: 0, of: d)
        }

        // Use one point per day (max ~7 for a week) instead of every log timestamp for performance
        var dayCurrent = weekStartDate
        var timestamps: [Date] = []
        while dayCurrent <= weekEndDate {
            if dayCurrent <= now {
                timestamps.append(dayCurrent)
            }
            dayCurrent = cal.date(byAdding: .day, value: 1, to: dayCurrent) ?? dayCurrent
        }
        if timestamps.isEmpty { return [] }

        // Precompute logs grouped by user and date for O(1) lookup per point
        var userLogsByDay: [String: [Date: [WorkoutLog]]] = [:]
        for userId in memberIds {
            let uid = userId.lowercased()
            var byDay: [Date: [WorkoutLog]] = [:]
            for log in logs where log.userId.lowercased() == uid {
                guard let t = effectiveTimestamp(for: log), t >= weekStartDate, t <= weekEndDate else { continue }
                let dayStart = cal.startOfDay(for: t)
                byDay[dayStart, default: []].append(log)
            }
            userLogsByDay[uid] = byDay
        }

        var points: [ChartPoint] = []
        var accumulatedByUser: [String: [WorkoutLog]] = [:]
        for uid in memberIds.map({ $0.lowercased() }) {
            accumulatedByUser[uid] = []
        }

        for t in timestamps {
            let dayStart = cal.startOfDay(for: t)
            for uid in memberIds.map({ $0.lowercased() }) {
                if let dayLogs = userLogsByDay[uid]?[dayStart] {
                    accumulatedByUser[uid, default: []].append(contentsOf: dayLogs)
                }
            }
            var progressByUser: [String: Double] = [:]
            for userId in memberIds {
                let uid = userId.lowercased()
                let logsUpTo = accumulatedByUser[uid] ?? []
                let prog = calculateUserProgress(userId: userId, logs: logsUpTo, challenge: challenge, exercises: exercises)
                progressByUser[userId] = prog.totalProgress * 100
            }
            points.append(ChartPoint(timestamp: iso8601Formatter.string(from: t), progressByUser: progressByUser))
        }
        return points
    }
}
