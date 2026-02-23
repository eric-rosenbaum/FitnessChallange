//
//  AppState.swift
//  FitnessChallenge
//
//  Global app state (dummy: no real auth).
//

import SwiftUI

@Observable
final class AppState {
    var isLoggedIn: Bool = false
    var hasOnboarded: Bool = false
    var logs: [WorkoutLog]
    var memberships: [GroupMembership]
    var groupName: String
    var groupInviteCode: String
    var punishments: [Punishment]

    init() {
        self.logs = DummyData.logs
        self.memberships = DummyData.memberships
        self.groupName = DummyData.groupName
        self.groupInviteCode = DummyData.groupInviteCode
        self.punishments = DummyData.punishments
    }

    var currentUserId: String { DummyData.currentUserId }

    var currentUserDisplayName: String {
        DummyData.profile(for: currentUserId)?.displayName ?? "You"
    }

    var isAdmin: Bool {
        memberships.first { $0.userId == currentUserId }?.role == .admin
    }

    var group: Group { Group(id: "group-1", name: groupName, inviteCode: groupInviteCode) }
    var activeWeek: ActiveWeek { DummyData.activeWeek() }
    var currentUserProgress: UserProgress { DummyData.calculateUserProgress(userId: currentUserId, logs: logs) }
    var currentUserCardioBreakdown: [String: Double] { DummyData.userCardioBreakdown(userId: currentUserId, logs: logs) }
    var leaderboard: [UserProgress] { DummyData.leaderboard(logs: logs) }
    var activityFeed: [ActivityFeedItem] { DummyData.activityFeed(logs: logs, limit: 5) }
    var exercises: [StrengthExercise] { DummyData.exercises }
    var challenge: WeekChallenge { DummyData.weekChallenge }

    var numberOfMembers: Int { memberships.count }
    var groupCardioTotal: Double { DummyData.groupCardioTotal(logs: logs, numberOfMembers: numberOfMembers) }
    var groupCardioTarget: Double { DummyData.groupCardioTarget(numberOfMembers: numberOfMembers) }
    var groupCardioProgress: Double { DummyData.groupCardioProgress(logs: logs, numberOfMembers: numberOfMembers) }
    var groupStrengthProgress: Double { DummyData.groupStrengthProgress(logs: logs, numberOfMembers: numberOfMembers) }
    var groupCardioBreakdown: [String: Double] { DummyData.groupCardioBreakdown(logs: logs) }
    var groupExerciseTotals: [String: Int] { DummyData.groupExerciseTotals(logs: logs, numberOfMembers: numberOfMembers) }
    var progressOverTimeChartPoints: [DummyData.ChartPoint] {
        DummyData.progressOverTime(logs: logs, weekStart: activeWeek.weekAssignment.startDate, weekEnd: activeWeek.weekAssignment.endDate)
    }

    /// e.g. "5 hrs 34 mins left" for group progress card
    var timeRemainingText: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.timeZone = TimeZone.current
        guard let end = formatter.date(from: activeWeek.weekAssignment.endDate) else { return "" }
        var cal = Calendar.current
        cal.timeZone = formatter.timeZone
        let endOfDay = cal.date(bySettingHour: 23, minute: 59, second: 59, of: end) ?? end
        let remaining = endOfDay.timeIntervalSince(Date())
        guard remaining > 0 else { return "0 mins left" }
        let totalSeconds = Int(remaining)
        let totalMinutes = totalSeconds / 60
        let totalHours = totalMinutes / 60
        let days = totalHours / 24
        let hours = totalHours % 24
        let mins = totalMinutes % 60
        let secs = totalSeconds % 60
        if totalHours < 1 {
            if totalMinutes > 0 { return "\(totalMinutes) \(totalMinutes == 1 ? "min" : "mins") \(secs) \(secs == 1 ? "sec" : "secs") left" }
            return "\(secs) \(secs == 1 ? "sec" : "secs") left"
        }
        if days < 1 {
            if mins > 0 { return "\(hours) \(hours == 1 ? "hr" : "hrs") \(mins) \(mins == 1 ? "min" : "mins") left" }
            return "\(hours) \(hours == 1 ? "hr" : "hrs") left"
        }
        if hours > 0 { return "\(days) \(days == 1 ? "day" : "days") \(hours) \(hours == 1 ? "hr" : "hrs") left" }
        return "\(days) \(days == 1 ? "day" : "days") left"
    }

    func login() {
        isLoggedIn = true
    }

    func completeOnboarding() {
        hasOnboarded = true
    }

    func signOut() {
        isLoggedIn = false
        hasOnboarded = false
    }

    func addLog(_ log: WorkoutLog) {
        DummyData.addLog(log, into: &logs)
    }

    func updateGroupName(_ name: String) {
        groupName = name
        DummyData.updateGroupName(name)
    }

    func removeMember(userId: String) {
        memberships.removeAll { $0.userId == userId }
        DummyData.removeMember(userId: userId)
    }

    func updateMemberType(userId: String, memberType: MemberType) {
        guard let i = memberships.firstIndex(where: { $0.userId == userId }) else { return }
        memberships[i].memberType = memberType
        DummyData.updateMemberType(userId: userId, memberType: memberType)
    }

    func addPunishment(_ p: Punishment) {
        punishments.append(p)
        DummyData.addPunishment(p)
    }

    func deletePunishment(id: String) {
        punishments.removeAll { $0.id == id }
        DummyData.deletePunishment(id: id)
    }

    func updateMyDisplayName(_ name: String) {
        DummyData.updateDisplayName(userId: currentUserId, name: name)
    }

    var upcomingAssignments: [WeekAssignment] { DummyData.upcomingAssignments }

    func updateCurrentWeekDates(start: String, end: String) {
        DummyData.updateCurrentWeekDates(start: start, end: end)
    }

    func updateCurrentWeekHost(userId: String) {
        DummyData.updateCurrentWeekHost(userId: userId)
    }

    func updateChallenge(cardioMetric: CardioMetric? = nil, cardioTarget: Double? = nil) {
        DummyData.updateChallenge(cardioMetric: cardioMetric, cardioTarget: cardioTarget)
    }

    func addExercise(name: String, targetReps: Int) {
        DummyData.addExercise(name: name, targetReps: targetReps)
    }

    func removeExercise(id: String) {
        DummyData.removeExercise(id: id)
    }

    func updateExercise(id: String, name: String? = nil, targetReps: Int? = nil) {
        DummyData.updateExercise(id: id, name: name, targetReps: targetReps)
    }

    func addUpcomingAssignment(hostUserId: String, startDate: String, endDate: String) {
        DummyData.addUpcomingAssignment(hostUserId: hostUserId, startDate: startDate, endDate: endDate)
    }

    func removeUpcomingAssignment(id: String) {
        DummyData.removeUpcomingAssignment(id: id)
    }

    func updateUpcomingAssignment(id: String, hostUserId: String? = nil, startDate: String? = nil, endDate: String? = nil) {
        DummyData.updateUpcomingAssignment(id: id, hostUserId: hostUserId, startDate: startDate, endDate: endDate)
    }
}
