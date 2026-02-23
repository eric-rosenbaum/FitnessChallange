//
//  DummyData.swift
//  FitnessChallenge
//
//  Static dummy data and helpers matching web app dummyData.
//

import Foundation

enum DummyData {
    static let currentUserId = "user-1"

    static var profiles: [Profile] = [
        Profile(id: "user-1", displayName: "You"),
        Profile(id: "user-2", displayName: "Alice"),
        Profile(id: "user-3", displayName: "Bob"),
        Profile(id: "user-4", displayName: "Charlie"),
        Profile(id: "user-5", displayName: "Diana"),
    ]

    static func updateDisplayName(userId: String, name: String) {
        guard let i = profiles.firstIndex(where: { $0.id == userId }) else { return }
        var name = name.trimmingCharacters(in: .whitespacesAndNewlines)
        if name.isEmpty { name = "You" }
        profiles[i] = Profile(id: profiles[i].id, displayName: name)
    }

    static var group: Group {
        Group(id: "group-1", name: groupName, inviteCode: groupInviteCode)
    }

    static var memberships: [GroupMembership] = [
        GroupMembership(id: "m1", groupId: "group-1", userId: "user-1", role: .admin, memberType: .participant),
        GroupMembership(id: "m2", groupId: "group-1", userId: "user-2", role: .member, memberType: .participant),
        GroupMembership(id: "m3", groupId: "group-1", userId: "user-3", role: .member, memberType: .participant),
        GroupMembership(id: "m4", groupId: "group-1", userId: "user-4", role: .member, memberType: .spectator),
        GroupMembership(id: "m5", groupId: "group-1", userId: "user-5", role: .member, memberType: .participant),
    ]

    static var groupName: String = "Fitness Friends"
    static var groupInviteCode: String = "FIT2024"

    /// Current week (mutable for Settings).
    static var weekAssignment = WeekAssignment(
        id: "week-1",
        groupId: "group-1",
        startDate: "2024-01-15",
        endDate: "2024-01-21",
        hostUserId: "user-2"
    )

    static var weekChallenge = WeekChallenge(
        id: "challenge-1",
        groupId: "group-1",
        weekAssignmentId: "week-1",
        cardioMetric: .miles,
        cardioTarget: 20
    )

    static var exercises: [StrengthExercise] = [
        StrengthExercise(id: "ex-1", weekChallengeId: "challenge-1", name: "Pushups", targetReps: 200, sortOrder: 1),
        StrengthExercise(id: "ex-2", weekChallengeId: "challenge-1", name: "Squats", targetReps: 100, sortOrder: 2),
        StrengthExercise(id: "ex-3", weekChallengeId: "challenge-1", name: "Pull-ups", targetReps: 50, sortOrder: 3),
    ]

    static var logs: [WorkoutLog] = [
        WorkoutLog(id: "log-1", groupId: "group-1", weekChallengeId: "challenge-1", userId: "user-1", loggedAt: "2024-01-15", logType: .cardio, cardioActivity: .run, cardioAmount: 3.5),
        WorkoutLog(id: "log-2", groupId: "group-1", weekChallengeId: "challenge-1", userId: "user-1", loggedAt: "2024-01-15", logType: .strength, exerciseId: "ex-1", strengthReps: 50),
        WorkoutLog(id: "log-3", groupId: "group-1", weekChallengeId: "challenge-1", userId: "user-1", loggedAt: "2024-01-16", logType: .cardio, cardioActivity: .bike, cardioAmount: 5.2),
        WorkoutLog(id: "log-4", groupId: "group-1", weekChallengeId: "challenge-1", userId: "user-1", loggedAt: "2024-01-16", logType: .strength, exerciseId: "ex-1", strengthReps: 40, note: "Feeling strong!"),
        WorkoutLog(id: "log-5", groupId: "group-1", weekChallengeId: "challenge-1", userId: "user-1", loggedAt: "2024-01-17", logType: .strength, exerciseId: "ex-2", strengthReps: 30),
        WorkoutLog(id: "log-6", groupId: "group-1", weekChallengeId: "challenge-1", userId: "user-1", loggedAt: "2024-01-17", logType: .cardio, cardioActivity: .run, cardioAmount: 4.0),
        WorkoutLog(id: "log-7", groupId: "group-1", weekChallengeId: "challenge-1", userId: "user-2", loggedAt: "2024-01-15", logType: .cardio, cardioActivity: .walk, cardioAmount: 2.5),
        WorkoutLog(id: "log-8", groupId: "group-1", weekChallengeId: "challenge-1", userId: "user-2", loggedAt: "2024-01-16", logType: .strength, exerciseId: "ex-1", strengthReps: 60),
        WorkoutLog(id: "log-9", groupId: "group-1", weekChallengeId: "challenge-1", userId: "user-2", loggedAt: "2024-01-17", logType: .cardio, cardioActivity: .run, cardioAmount: 5.0),
        WorkoutLog(id: "log-10", groupId: "group-1", weekChallengeId: "challenge-1", userId: "user-3", loggedAt: "2024-01-15", logType: .cardio, cardioActivity: .bike, cardioAmount: 8.0),
        WorkoutLog(id: "log-11", groupId: "group-1", weekChallengeId: "challenge-1", userId: "user-3", loggedAt: "2024-01-16", logType: .strength, exerciseId: "ex-2", strengthReps: 50),
        WorkoutLog(id: "log-12", groupId: "group-1", weekChallengeId: "challenge-1", userId: "user-3", loggedAt: "2024-01-17", logType: .cardio, cardioActivity: .run, cardioAmount: 6.5),
        WorkoutLog(id: "log-13", groupId: "group-1", weekChallengeId: "challenge-1", userId: "user-4", loggedAt: "2024-01-15", logType: .cardio, cardioActivity: .run, cardioAmount: 3.0),
        WorkoutLog(id: "log-14", groupId: "group-1", weekChallengeId: "challenge-1", userId: "user-5", loggedAt: "2024-01-15", logType: .cardio, cardioActivity: .walk, cardioAmount: 4.0),
    ]

    // MARK: - Helpers
    static func profile(for userId: String) -> Profile? {
        profiles.first { $0.id == userId }
    }

    static func calculateUserProgress(userId: String, logs: [WorkoutLog] = logs) -> UserProgress {
        let userLogs = logs.filter { $0.userId == userId }
        var cardioTotal: Double = 0
        var exerciseTotals: [String: Int] = [:]
        for log in userLogs {
            if log.logType == .cardio, let amt = log.cardioAmount {
                cardioTotal += amt
            }
            if log.logType == .strength, let exId = log.exerciseId, let reps = log.strengthReps {
                exerciseTotals[exId, default: 0] += reps
            }
        }
        let cardioProgress = min(cardioTotal / weekChallenge.cardioTarget, 1.0)
        var strengthProgress: Double = 0
        if !exercises.isEmpty {
            let perEx: [Double] = exercises.map { ex in
                let total = exerciseTotals[ex.id] ?? 0
                return min(Double(total) / Double(ex.targetReps), 1.0)
            }
            strengthProgress = perEx.reduce(0, +) / Double(perEx.count)
        }
        let totalProgress = (cardioProgress + strengthProgress) / 2
        let displayName = profile(for: userId)?.displayName ?? "You"
        return UserProgress(
            userId: userId,
            displayName: displayName,
            cardioTotal: cardioTotal,
            cardioProgress: cardioProgress,
            strengthOverallProgress: strengthProgress,
            totalProgress: totalProgress,
            exerciseTotals: exerciseTotals
        )
    }

    /// Same as calculateUserProgress but using provided challenge and exercises (for Supabase/active week).
    static func calculateUserProgress(userId: String, logs: [WorkoutLog], challenge: WeekChallenge, exercises: [StrengthExercise], displayName: String? = nil) -> UserProgress {
        let userLogs = logs.filter { $0.userId == userId }
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
            displayName: displayName ?? profile(for: userId)?.displayName ?? "You",
            cardioTotal: cardioTotal,
            cardioProgress: cardioProgress,
            strengthOverallProgress: strengthProgress,
            totalProgress: totalProgress,
            exerciseTotals: exerciseTotals
        )
    }

    static func leaderboard(logs: [WorkoutLog] = logs) -> [UserProgress] {
        let participantIds = memberships.map(\.userId)
        return participantIds
            .map { calculateUserProgress(userId: $0, logs: logs) }
            .sorted { a, b in
                if b.totalProgress != a.totalProgress { return b.totalProgress > a.totalProgress }
                if b.cardioProgress != a.cardioProgress { return b.cardioProgress > a.cardioProgress }
                return b.strengthOverallProgress > a.strengthOverallProgress
            }
    }

    static func activityFeed(logs: [WorkoutLog] = logs, limit: Int = 5) -> [ActivityFeedItem] {
        let sorted = logs.sorted { ($0.id > $1.id) }
        return Array(sorted.prefix(limit)).map { log in
            let pro = profile(for: log.userId) ?? Profile(id: log.userId, displayName: "Someone")
            let exName = log.exerciseId.flatMap { eid in exercises.first(where: { $0.id == eid })?.name }
            return ActivityFeedItem(
                id: log.id,
                userId: log.userId,
                displayName: pro.displayName,
                logType: log.logType,
                cardioActivity: log.cardioActivity,
                cardioAmount: log.cardioAmount,
                exerciseName: exName,
                strengthReps: log.strengthReps,
                createdAt: log.loggedAt
            )
        }
    }

    static func activeWeek() -> ActiveWeek {
        let hostName = profile(for: weekAssignment.hostUserId)?.displayName ?? "Host"
        return ActiveWeek(
            weekAssignment: weekAssignment,
            challenge: weekChallenge,
            exercises: exercises,
            hostName: hostName
        )
    }

    static func addLog(_ log: WorkoutLog, into logs: inout [WorkoutLog]) {
        logs.append(log)
    }

    // MARK: - Mutable group/members (for Settings)
    static func updateGroupName(_ name: String) {
        groupName = name
    }

    static func updateGroupInviteCode(_ code: String) {
        groupInviteCode = code
    }

    static func removeMember(userId: String) {
        memberships.removeAll { $0.userId == userId }
    }

    static func updateMemberType(userId: String, memberType: MemberType) {
        if let i = memberships.firstIndex(where: { $0.userId == userId }) {
            memberships[i].memberType = memberType
        }
    }

    static var punishments: [Punishment] = []

    static func addPunishment(_ p: Punishment) {
        punishments.append(p)
    }

    static func deletePunishment(id: String) {
        punishments.removeAll { $0.id == id }
    }

    // MARK: - Current week & upcoming assignments (mutable for Settings)
    static var upcomingAssignments: [WeekAssignment] = []

    static func updateCurrentWeekDates(start: String, end: String) {
        weekAssignment.startDate = start
        weekAssignment.endDate = end
    }

    static func updateCurrentWeekHost(userId: String) {
        weekAssignment.hostUserId = userId
    }

    static func updateChallenge(cardioMetric: CardioMetric? = nil, cardioTarget: Double? = nil) {
        if let m = cardioMetric { weekChallenge.cardioMetric = m }
        if let t = cardioTarget { weekChallenge.cardioTarget = t }
    }

    static func addExercise(name: String, targetReps: Int) {
        let order = (exercises.map(\.sortOrder).max() ?? 0) + 1
        exercises.append(StrengthExercise(
            id: "ex-\(UUID().uuidString)",
            weekChallengeId: weekChallenge.id,
            name: name,
            targetReps: targetReps,
            sortOrder: order
        ))
    }

    static func removeExercise(id: String) {
        exercises.removeAll { $0.id == id }
    }

    static func updateExercise(id: String, name: String? = nil, targetReps: Int? = nil) {
        guard let i = exercises.firstIndex(where: { $0.id == id }) else { return }
        if let n = name { exercises[i].name = n }
        if let r = targetReps { exercises[i].targetReps = r }
    }

    static func addUpcomingAssignment(hostUserId: String, startDate: String, endDate: String) {
        upcomingAssignments.append(WeekAssignment(
            id: "week-up-\(UUID().uuidString)",
            groupId: "group-1",
            startDate: startDate,
            endDate: endDate,
            hostUserId: hostUserId
        ))
    }

    static func removeUpcomingAssignment(id: String) {
        upcomingAssignments.removeAll { $0.id == id }
    }

    static func updateUpcomingAssignment(id: String, hostUserId: String? = nil, startDate: String? = nil, endDate: String? = nil) {
        guard let i = upcomingAssignments.firstIndex(where: { $0.id == id }) else { return }
        if let h = hostUserId { upcomingAssignments[i].hostUserId = h }
        if let s = startDate { upcomingAssignments[i].startDate = s }
        if let e = endDate { upcomingAssignments[i].endDate = e }
    }

    /// Cardio breakdown by activity (Run, Walk, etc.) for one user.
    static func userCardioBreakdown(userId: String, logs: [WorkoutLog] = logs) -> [String: Double] {
        var out: [String: Double] = [:]
        for log in logs where log.userId == userId && log.logType == .cardio {
            guard let act = log.cardioActivity, let amt = log.cardioAmount else { continue }
            let name = act.rawValue.prefix(1).uppercased() + act.rawValue.dropFirst()
            out[name, default: 0] += amt
        }
        return out
    }

    // MARK: - Group progress (each person capped at 100%)
    static func groupCardioTotal(logs: [WorkoutLog] = logs, numberOfMembers: Int = memberships.count) -> Double {
        var userTotals: [String: Double] = [:]
        for log in logs where log.logType == .cardio {
            guard let amt = log.cardioAmount else { continue }
            userTotals[log.userId, default: 0] += amt
        }
        return userTotals.values.map { min($0, weekChallenge.cardioTarget) }.reduce(0, +)
    }

    /// Group cardio total using explicit cardio target (for Supabase/active week).
    static func groupCardioTotal(logs: [WorkoutLog], cardioTargetPerPerson: Double) -> Double {
        var userTotals: [String: Double] = [:]
        for log in logs where log.logType == .cardio {
            guard let amt = log.cardioAmount else { continue }
            userTotals[log.userId, default: 0] += amt
        }
        return userTotals.values.map { min($0, cardioTargetPerPerson) }.reduce(0, +)
    }

    static func groupCardioTarget(numberOfMembers: Int = memberships.count) -> Double {
        weekChallenge.cardioTarget * Double(numberOfMembers)
    }

    static func groupCardioTarget(numberOfMembers: Int, cardioTargetPerPerson: Double) -> Double {
        cardioTargetPerPerson * Double(numberOfMembers)
    }

    static func groupCardioProgress(logs: [WorkoutLog] = logs, numberOfMembers: Int = memberships.count) -> Double {
        let total = groupCardioTotal(logs: logs, numberOfMembers: numberOfMembers)
        let target = groupCardioTarget(numberOfMembers: numberOfMembers)
        return target > 0 ? min(total / target, 1) : 0
    }

    static func groupCardioProgress(logs: [WorkoutLog], numberOfMembers: Int, cardioTargetPerPerson: Double) -> Double {
        let total = groupCardioTotal(logs: logs, cardioTargetPerPerson: cardioTargetPerPerson)
        let target = groupCardioTarget(numberOfMembers: numberOfMembers, cardioTargetPerPerson: cardioTargetPerPerson)
        return target > 0 ? min(total / target, 1) : 0
    }

    static func groupExerciseTotals(logs: [WorkoutLog] = logs, numberOfMembers: Int = memberships.count) -> [String: Int] {
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

    static func groupStrengthProgress(logs: [WorkoutLog] = logs, numberOfMembers: Int = memberships.count) -> Double {
        let totals = groupExerciseTotals(logs: logs, numberOfMembers: numberOfMembers)
        guard !exercises.isEmpty else { return 0 }
        let perEx: [Double] = exercises.map { ex in
            let total = totals[ex.id] ?? 0
            let target = ex.targetReps * numberOfMembers
            return target > 0 ? min(Double(total) / Double(target), 1) : 0
        }
        return perEx.reduce(0, +) / Double(perEx.count)
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

    /// Cardio breakdown by activity (Run, Walk, etc.) across all logs.
    static func groupCardioBreakdown(logs: [WorkoutLog] = logs) -> [String: Double] {
        var out: [String: Double] = [:]
        for log in logs where log.logType == .cardio {
            guard let act = log.cardioActivity, let amt = log.cardioAmount else { continue }
            let name = act.rawValue.prefix(1).uppercased() + act.rawValue.dropFirst()
            out[name, default: 0] += amt
        }
        return out
    }

    /// Progress over time: for each day in [startDate...endDate], cumulative progress % per user.
    struct ChartPoint {
        let date: String
        let progressByUser: [String: Double] // userId -> 0...100
    }

    static func progressOverTime(logs: [WorkoutLog] = logs, weekStart: String = weekAssignment.startDate, weekEnd: String = weekAssignment.endDate) -> [ChartPoint] {
        progressOverTime(logs: logs, weekStart: weekStart, weekEnd: weekEnd, challenge: weekChallenge, exercises: exercises, memberIds: memberships.map(\.userId))
    }

    static func progressOverTime(logs: [WorkoutLog], weekStart: String, weekEnd: String, challenge: WeekChallenge, exercises: [StrengthExercise], memberIds: [String]) -> [ChartPoint] {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.timeZone = TimeZone.current
        guard let start = formatter.date(from: weekStart), let end = formatter.date(from: weekEnd) else { return [] }
        var points: [ChartPoint] = []
        var current = start
        while current <= end {
            let dateStr = formatter.string(from: current)
            var progressByUser: [String: Double] = [:]
            for userId in memberIds {
                let logsUpTo = logs.filter { log in
                    guard let logDate = formatter.date(from: log.loggedAt) else { return false }
                    return log.userId == userId && logDate <= current
                }
                let prog = calculateUserProgress(userId: userId, logs: logsUpTo, challenge: challenge, exercises: exercises)
                progressByUser[userId] = prog.totalProgress * 100
            }
            points.append(ChartPoint(date: dateStr, progressByUser: progressByUser))
            current = Calendar.current.date(byAdding: .day, value: 1, to: current) ?? current
        }
        return points
    }
}
