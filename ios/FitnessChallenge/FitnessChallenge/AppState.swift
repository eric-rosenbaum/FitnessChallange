//
//  AppState.swift
//  FitnessChallenge
//
//  Global app state. Uses Supabase when configured; otherwise dummy data.
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

    // Supabase-backed state (when useSupabase)
    var groupId: String?
    var activeWeekLoaded: ActiveWeek?
    var leaderboardLoaded: [UserProgress] = []
    var activityFeedLoaded: [ActivityFeedItem] = []
    var upcomingAssignmentsLoaded: [WeekAssignment] = []
    var isLoading = false
    var loadError: String?
    var authLoading = false
    var currentUserIdFromSession: String?

    private var supabaseService: SupabaseService?

    var useSupabase: Bool { SupabaseConfig.isConfigured }

    init() {
        self.logs = DummyData.logs
        self.memberships = DummyData.memberships
        self.groupName = DummyData.groupName
        self.groupInviteCode = DummyData.groupInviteCode
        self.punishments = DummyData.punishments
        if SupabaseConfig.isConfigured, let url = SupabaseConfig.url, let key = SupabaseConfig.anonKey {
            self.supabaseService = SupabaseService(url: url, anonKey: key)
        }
    }

    var currentUserId: String {
        if useSupabase, let id = currentUserIdFromSession { return id }
        return DummyData.currentUserId
    }

    var currentUserDisplayName: String {
        if useSupabase, let n = currentUserDisplayNameStored { return n }
        return DummyData.profile(for: currentUserId)?.displayName ?? "You"
    }

    private var currentUserDisplayNameStored: String?
    func setCurrentUserDisplayName(_ name: String) { currentUserDisplayNameStored = name }

    var isAdmin: Bool {
        memberships.first { $0.userId == currentUserId }?.role == .admin
    }

    var hasGroup: Bool {
        if useSupabase { return groupId != nil }
        return true
    }

    var group: Group {
        if useSupabase, let id = groupId {
            return Group(id: id, name: groupName, inviteCode: groupInviteCode)
        }
        return Group(id: "group-1", name: groupName, inviteCode: groupInviteCode)
    }

    var activeWeek: ActiveWeek {
        if useSupabase, let w = activeWeekLoaded { return w }
        return DummyData.activeWeek()
    }

    var currentUserProgress: UserProgress {
        if useSupabase, !leaderboardLoaded.isEmpty, let p = leaderboardLoaded.first(where: { $0.userId == currentUserId }) {
            return p
        }
        if useSupabase, let ch = challenge {
            return DummyData.calculateUserProgress(userId: currentUserId, logs: logs, challenge: ch, exercises: exercises, displayName: currentUserDisplayName)
        }
        return DummyData.calculateUserProgress(userId: currentUserId, logs: logs)
    }

    var currentUserCardioBreakdown: [String: Double] {
        DummyData.userCardioBreakdown(userId: currentUserId, logs: logs)
    }

    var leaderboard: [UserProgress] {
        if useSupabase, !leaderboardLoaded.isEmpty { return leaderboardLoaded }
        if useSupabase, let ch = challenge {
            let participantIds = memberships.filter { $0.memberType == .participant }.map(\.userId)
            let list = participantIds.map { uid in
                DummyData.calculateUserProgress(userId: uid, logs: logs, challenge: ch, exercises: exercises, displayName: uid == currentUserId ? currentUserDisplayName : nil)
            }
            return list.sorted { $0.totalProgress > $1.totalProgress }
        }
        return DummyData.leaderboard(logs: logs)
    }

    var activityFeed: [ActivityFeedItem] {
        if useSupabase, !activityFeedLoaded.isEmpty { return activityFeedLoaded }
        return DummyData.activityFeed(logs: logs, limit: 5)
    }

    var exercises: [StrengthExercise] {
        activeWeek.exercises
    }

    var challenge: WeekChallenge? {
        activeWeek.challenge
    }

    var numberOfMembers: Int { memberships.count }
    /// When using Supabase, count only participants for group targets (matches getLeaderboard).
    private var participantCount: Int {
        if useSupabase { return memberships.filter { $0.memberType == .participant }.count }
        return memberships.count
    }
    var groupCardioTotal: Double {
        if useSupabase, let ch = challenge {
            return DummyData.groupCardioTotal(logs: logs, cardioTargetPerPerson: ch.cardioTarget)
        }
        return DummyData.groupCardioTotal(logs: logs, numberOfMembers: numberOfMembers)
    }
    var groupCardioTarget: Double {
        if useSupabase, let ch = challenge {
            return DummyData.groupCardioTarget(numberOfMembers: max(participantCount, 1), cardioTargetPerPerson: ch.cardioTarget)
        }
        return DummyData.groupCardioTarget(numberOfMembers: numberOfMembers)
    }
    var groupCardioProgress: Double {
        if useSupabase, let ch = challenge {
            return DummyData.groupCardioProgress(logs: logs, numberOfMembers: max(participantCount, 1), cardioTargetPerPerson: ch.cardioTarget)
        }
        return DummyData.groupCardioProgress(logs: logs, numberOfMembers: numberOfMembers)
    }
    var groupStrengthProgress: Double {
        if useSupabase, !exercises.isEmpty {
            return DummyData.groupStrengthProgress(logs: logs, numberOfMembers: max(participantCount, 1), exercises: exercises)
        }
        return DummyData.groupStrengthProgress(logs: logs, numberOfMembers: numberOfMembers)
    }
    var groupCardioBreakdown: [String: Double] { DummyData.groupCardioBreakdown(logs: logs) }
    var groupExerciseTotals: [String: Int] {
        if useSupabase, !exercises.isEmpty {
            return DummyData.groupExerciseTotals(logs: logs, exercises: exercises)
        }
        return DummyData.groupExerciseTotals(logs: logs, numberOfMembers: numberOfMembers)
    }
    var progressOverTimeChartPoints: [DummyData.ChartPoint] {
        if useSupabase, let ch = challenge {
            let memberIds = useSupabase ? memberships.filter { $0.memberType == .participant }.map(\.userId) : memberships.map(\.userId)
            return DummyData.progressOverTime(logs: logs, weekStart: activeWeek.weekAssignment.startDate, weekEnd: activeWeek.weekAssignment.endDate, challenge: ch, exercises: exercises, memberIds: memberIds.isEmpty ? [currentUserId] : memberIds)
        }
        return DummyData.progressOverTime(logs: logs, weekStart: activeWeek.weekAssignment.startDate, weekEnd: activeWeek.weekAssignment.endDate)
    }

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

    // MARK: - Auth (Supabase or dummy)

    func login() {
        if !useSupabase {
            isLoggedIn = true
        }
    }

    func completeOnboarding() {
        hasOnboarded = true
    }

    func signOut() {
        isLoggedIn = false
        hasOnboarded = false
        if useSupabase {
            currentUserIdFromSession = nil
            currentUserDisplayNameStored = nil
            groupId = nil
            groupName = ""
            groupInviteCode = ""
            memberships = []
            logs = []
            punishments = []
            activeWeekLoaded = nil
            leaderboardLoaded = []
            activityFeedLoaded = []
            upcomingAssignmentsLoaded = []
            Task { try? await supabaseService?.signOut() }
        }
    }

    /// Call on launch when useSupabase to restore session and load user/group.
    func checkSession() async {
        guard useSupabase, let svc = supabaseService else { return }
        authLoading = true
        defer { authLoading = false }
        do {
            let hasSession = await svc.session()
            if !hasSession {
                isLoggedIn = false
                currentUserIdFromSession = nil
                currentUserDisplayNameStored = nil
                groupId = nil
                hasOnboarded = false
                return
            }
            if let uid = await svc.currentUserId {
                currentUserIdFromSession = uid
                isLoggedIn = true
                if let profile = try? await svc.getProfile(userId: uid) {
                    setCurrentUserDisplayName(profile.displayName)
                }
                if let (grp, mem) = try? await svc.getMembershipForUser(userId: uid) {
                    groupId = grp.id
                    groupName = grp.name
                    groupInviteCode = grp.inviteCode
                    memberships = try await svc.getGroupMemberships(groupId: grp.id)
                    hasOnboarded = true
                    await refresh()
                } else {
                    hasOnboarded = true
                }
            }
        } catch {
            loadError = error.localizedDescription
        }
    }

    /// Sign in with email/password (Supabase only).
    func signIn(email: String, password: String) async throws {
        guard useSupabase, let svc = supabaseService else { return }
        try await svc.signIn(email: email, password: password)
        if let uid = await svc.currentUserId {
            currentUserIdFromSession = uid
            isLoggedIn = true
            if let profile = try? await svc.getProfile(userId: uid) {
                setCurrentUserDisplayName(profile.displayName)
            }
            if let (grp, mem) = try? await svc.getMembershipForUser(userId: uid) {
                groupId = grp.id
                groupName = grp.name
                groupInviteCode = grp.inviteCode
                memberships = try await svc.getGroupMemberships(groupId: grp.id)
                hasOnboarded = true
                await refresh()
            } else {
                hasOnboarded = true
            }
        }
    }

    /// Sign up with email/password (Supabase only).
    func signUp(email: String, password: String) async throws {
        guard useSupabase, let svc = supabaseService else { return }
        try await svc.signUp(email: email, password: password)
        if let uid = await svc.currentUserId {
            currentUserIdFromSession = uid
            isLoggedIn = true
            hasOnboarded = false
        }
    }

    /// Load group data from Supabase (when we have groupId).
    func refresh() async {
        guard useSupabase, let svc = supabaseService, let gid = groupId else { return }
        isLoading = true
        loadError = nil
        defer { isLoading = false }
        do {
            memberships = try await svc.getGroupMemberships(groupId: gid)
            activeWeekLoaded = try await svc.getActiveWeek(groupId: gid)
            upcomingAssignmentsLoaded = try await svc.getUpcomingAssignments(groupId: gid, excludeAssignmentId: activeWeekLoaded?.weekAssignment.id)
            if let week = activeWeekLoaded, let ch = week.challenge {
                logs = try await svc.getWorkoutLogs(weekChallengeId: ch.id, userId: nil)
            } else {
                logs = []
            }
            leaderboardLoaded = try await svc.getLeaderboard(groupId: gid)
            activityFeedLoaded = try await svc.getActivityFeed(groupId: gid, limit: 5)
            punishments = try await svc.getAllPunishments(groupId: gid)
        } catch {
            loadError = error.localizedDescription
        }
    }

    // MARK: - Mutations (Supabase or dummy)

    func addLog(_ log: WorkoutLog, completion: (@Sendable () -> Void)? = nil) {
        if useSupabase, let svc = supabaseService, let gid = groupId, let ch = challenge {
            Task {
                do {
                    _ = try await svc.createWorkoutLog(
                        groupId: gid,
                        weekChallengeId: ch.id,
                        userId: currentUserId,
                        loggedAt: log.loggedAt,
                        logType: log.logType,
                        cardioActivity: log.cardioActivity,
                        cardioAmount: log.cardioAmount,
                        exerciseId: log.exerciseId,
                        strengthReps: log.strengthReps,
                        note: log.note
                    )
                    await refresh()
                } catch {
                    await MainActor.run { loadError = error.localizedDescription }
                }
                await MainActor.run { completion?() }
            }
            return
        }
        DummyData.addLog(log, into: &logs)
        completion?()
    }

    func updateLog(logId: String, cardioAmount: Double? = nil, strengthReps: Int? = nil) async {
        if useSupabase, let svc = supabaseService {
            do {
                try await svc.updateWorkoutLog(logId: logId, cardioAmount: cardioAmount, strengthReps: strengthReps)
                await refresh()
            } catch {
                await MainActor.run { loadError = error.localizedDescription }
            }
            return
        }
        guard let i = logs.firstIndex(where: { $0.id == logId }) else { return }
        if let amount = cardioAmount { logs[i].cardioAmount = amount }
        if let reps = strengthReps { logs[i].strengthReps = reps }
    }

    func deleteLog(logId: String) async {
        if useSupabase, let svc = supabaseService {
            do {
                try await svc.deleteWorkoutLog(logId: logId)
                await refresh()
            } catch {
                await MainActor.run { loadError = error.localizedDescription }
            }
            return
        }
        logs.removeAll { $0.id == logId }
    }

    func updateGroupName(_ name: String) {
        groupName = name
        if useSupabase, let svc = supabaseService, let gid = groupId {
            Task {
                try? await svc.updateGroupName(groupId: gid, name: name)
                await refresh()
            }
            return
        }
        DummyData.updateGroupName(name)
    }

    func removeMember(userId: String) {
        memberships.removeAll { $0.userId == userId }
        if useSupabase, let svc = supabaseService, let gid = groupId {
            Task {
                try? await svc.removeMember(groupId: gid, userId: userId)
                await refresh()
            }
            return
        }
        DummyData.removeMember(userId: userId)
    }

    func updateMemberType(userId: String, memberType: MemberType) {
        guard let i = memberships.firstIndex(where: { $0.userId == userId }) else { return }
        memberships[i].memberType = memberType
        if useSupabase, let svc = supabaseService, let gid = groupId {
            Task {
                try? await svc.updateMemberType(groupId: gid, userId: userId, memberType: memberType)
                await refresh()
            }
            return
        }
        DummyData.updateMemberType(userId: userId, memberType: memberType)
    }

    func addPunishment(_ p: Punishment) {
        punishments.append(p)
        if useSupabase, let svc = supabaseService, let gid = groupId {
            Task {
                _ = try? await svc.createPunishment(
                    groupId: gid,
                    assignedBy: currentUserId,
                    startDate: p.startDate,
                    endDate: p.endDate,
                    userIds: p.assignedUserIds,
                    cardioMetric: p.cardioMetric,
                    cardioTarget: p.cardioTarget,
                    exercises: p.exerciseName != nil ? [(name: p.exerciseName!, targetReps: p.exerciseTargetReps ?? 0)] : []
                )
                await refresh()
            }
            return
        }
        DummyData.addPunishment(p)
    }

    func deletePunishment(id: String) {
        punishments.removeAll { $0.id == id }
        if useSupabase, let svc = supabaseService {
            Task {
                try? await svc.deletePunishment(punishmentId: id)
                await refresh()
            }
            return
        }
        DummyData.deletePunishment(id: id)
    }

    func updateMyDisplayName(_ name: String) {
        if useSupabase, let svc = supabaseService {
            setCurrentUserDisplayName(name)
            Task {
                try? await svc.updateProfile(userId: currentUserId, displayName: name)
            }
            return
        }
        DummyData.updateDisplayName(userId: currentUserId, name: name)
    }

    var upcomingAssignments: [WeekAssignment] {
        if useSupabase, !upcomingAssignmentsLoaded.isEmpty { return upcomingAssignmentsLoaded }
        return DummyData.upcomingAssignments
    }

    func updateCurrentWeekDates(start: String, end: String) {
        guard useSupabase, let svc = supabaseService, let aid = activeWeekLoaded?.weekAssignment.id else {
            DummyData.updateCurrentWeekDates(start: start, end: end)
            return
        }
        Task {
            try? await svc.updateWeekAssignment(assignmentId: aid, hostUserId: activeWeekLoaded!.weekAssignment.hostUserId, assignedBy: currentUserId, startDate: start, endDate: end)
            await refresh()
        }
    }

    func updateCurrentWeekHost(userId: String) {
        guard useSupabase, let svc = supabaseService, let aid = activeWeekLoaded?.weekAssignment.id else {
            DummyData.updateCurrentWeekHost(userId: userId)
            return
        }
        Task {
            try? await svc.updateWeekAssignment(assignmentId: aid, hostUserId: userId, assignedBy: currentUserId, startDate: nil, endDate: nil)
            await refresh()
        }
    }

    func updateChallenge(cardioMetric: CardioMetric? = nil, cardioTarget: Double? = nil) {
        guard useSupabase, let svc = supabaseService, let ch = activeWeekLoaded?.challenge else {
            DummyData.updateChallenge(cardioMetric: cardioMetric, cardioTarget: cardioTarget)
            return
        }
        let metric = cardioMetric ?? ch.cardioMetric
        let target = cardioTarget ?? ch.cardioTarget
        let exs = activeWeekLoaded!.exercises.map { (id: $0.id as String?, name: $0.name, targetReps: $0.targetReps) }
        Task {
            try? await svc.updateWeekChallenge(challengeId: ch.id, cardioMetric: metric, cardioTarget: target, exercises: exs)
            await refresh()
        }
    }

    func addExercise(name: String, targetReps: Int) {
        guard useSupabase, let svc = supabaseService, let ch = activeWeekLoaded?.challenge else {
            DummyData.addExercise(name: name, targetReps: targetReps)
            return
        }
        let exs = activeWeekLoaded!.exercises.map { (id: $0.id as String?, name: $0.name, targetReps: $0.targetReps) } + [(id: nil as String?, name: name, targetReps: targetReps)]
        Task {
            try? await svc.updateWeekChallenge(challengeId: ch.id, cardioMetric: ch.cardioMetric, cardioTarget: ch.cardioTarget, exercises: exs)
            await refresh()
        }
    }

    func removeExercise(id: String) {
        guard useSupabase, let svc = supabaseService, let ch = activeWeekLoaded?.challenge else {
            DummyData.removeExercise(id: id)
            return
        }
        let exs = activeWeekLoaded!.exercises.filter { $0.id != id }.map { (id: $0.id as String?, name: $0.name, targetReps: $0.targetReps) }
        Task {
            try? await svc.updateWeekChallenge(challengeId: ch.id, cardioMetric: ch.cardioMetric, cardioTarget: ch.cardioTarget, exercises: exs)
            await refresh()
        }
    }

    func updateExercise(id: String, name: String? = nil, targetReps: Int? = nil) {
        guard useSupabase, let svc = supabaseService, let ch = activeWeekLoaded?.challenge else {
            DummyData.updateExercise(id: id, name: name, targetReps: targetReps)
            return
        }
        var exs: [(id: String?, name: String, targetReps: Int)] = activeWeekLoaded!.exercises.map { ($0.id as String?, $0.name, $0.targetReps) }
        if let i = exs.firstIndex(where: { $0.id == id }) {
            exs[i] = (exs[i].id, name ?? exs[i].name, targetReps ?? exs[i].targetReps)
        }
        Task {
            try? await svc.updateWeekChallenge(challengeId: ch.id, cardioMetric: ch.cardioMetric, cardioTarget: ch.cardioTarget, exercises: exs.map { ($0.id, $0.name, $0.targetReps) })
            await refresh()
        }
    }

    func addUpcomingAssignment(hostUserId: String, startDate: String, endDate: String) {
        guard useSupabase, let svc = supabaseService, let gid = groupId else {
            DummyData.addUpcomingAssignment(hostUserId: hostUserId, startDate: startDate, endDate: endDate)
            return
        }
        Task {
            _ = try? await svc.createWeekAssignment(groupId: gid, startDate: startDate, endDate: endDate, hostUserId: hostUserId, assignedBy: currentUserId)
            await refresh()
        }
    }

    func removeUpcomingAssignment(id: String) {
        guard useSupabase, let svc = supabaseService else {
            DummyData.removeUpcomingAssignment(id: id)
            return
        }
        Task {
            try? await svc.deleteWeekAssignment(assignmentId: id)
            await refresh()
        }
    }

    func updateUpcomingAssignment(id: String, hostUserId: String? = nil, startDate: String? = nil, endDate: String? = nil) {
        guard useSupabase, let svc = supabaseService else {
            DummyData.updateUpcomingAssignment(id: id, hostUserId: hostUserId, startDate: startDate, endDate: endDate)
            return
        }
        let assignment = upcomingAssignmentsLoaded.first { $0.id == id }
        let host = hostUserId ?? assignment?.hostUserId ?? currentUserId
        Task {
            try? await svc.updateWeekAssignment(assignmentId: id, hostUserId: host, assignedBy: currentUserId, startDate: startDate, endDate: endDate)
            await refresh()
        }
    }

    /// Create group (Supabase). On success sets groupId and refreshes.
    func createGroup(name: String, inviteCode: String) async throws {
        guard useSupabase, let svc = supabaseService else { return }
        let grp = try await svc.createGroup(name: name, inviteCode: inviteCode, userId: currentUserId)
        groupId = grp.id
        groupName = grp.name
        groupInviteCode = grp.inviteCode
        memberships = try await svc.getGroupMemberships(groupId: grp.id)
        await refresh()
    }

    /// Join group by invite code (Supabase). On success sets groupId and refreshes.
    func joinGroup(inviteCode: String) async throws {
        guard useSupabase, let svc = supabaseService else { return }
        let grp = try await svc.joinGroupByInviteCode(inviteCode: inviteCode.trimmingCharacters(in: .whitespacesAndNewlines), userId: currentUserId)
        groupId = grp.id
        groupName = grp.name
        groupInviteCode = grp.inviteCode
        memberships = try await svc.getGroupMemberships(groupId: grp.id)
        await refresh()
    }
}

private extension Optional {
    var isNil: Bool { self == nil }
}
