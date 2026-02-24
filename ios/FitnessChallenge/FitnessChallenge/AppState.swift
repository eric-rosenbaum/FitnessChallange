//
//  AppState.swift
//  FitnessChallenge
//
//  Global app state. Uses Supabase for persistence. Session cache for instant UI on launch.
//

import SwiftUI

private let dashboardLog = "FitnessChallenge.Dashboard"

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
    /// Next upcoming assignment where current user is host (within 3 days), with no challenge yet. For "You're the host" banner.
    var upcomingAssignmentForUser: WeekAssignment?
    var activePunishment: ActivePunishment?
    var punishmentLogs: [PunishmentLog] = []
    var punishmentProgress: PunishmentProgress?
    var punishmentLeaderboard: [PunishmentProgress] = []
    /// When user has no punishment but group has an active one (for leaderboard-only card).
    var leaderboardPunishment: ActivePunishment?
    var isLoading = false
    var loadError: String?
    var authLoading = false
    var currentUserIdFromSession: String?

    private var _supabaseService: SupabaseService?

    private var supabaseService: SupabaseService? {
        if let s = _supabaseService { return s }
        guard SupabaseConfig.isConfigured, let url = SupabaseConfig.url, let key = SupabaseConfig.anonKey else { return nil }
        let svc = SupabaseService(url: url, anonKey: key)
        _supabaseService = svc
        print("[\(dashboardLog)] Supabase client created (lazy), url=\(url.absoluteString)")
        return svc
    }

    var useSupabase: Bool { SupabaseConfig.isConfigured }

    init() {
        self.logs = []
        self.memberships = []
        self.groupName = ""
        self.groupInviteCode = ""
        self.punishments = []
        if let cache = SessionCache.load() {
            currentUserIdFromSession = cache.currentUserId
            currentUserDisplayNameStored = cache.currentUserDisplayName
            groupId = cache.groupId
            groupName = cache.groupName
            groupInviteCode = cache.groupInviteCode
            memberships = cache.memberships
            activeWeekLoaded = cache.activeWeek
            logs = cache.logs
            leaderboardLoaded = cache.leaderboard
            activityFeedLoaded = cache.activityFeed
            upcomingAssignmentsLoaded = cache.upcomingAssignments
            punishments = cache.punishments
            activePunishment = cache.activePunishment
            punishmentLogs = cache.punishmentLogs
            punishmentProgress = cache.punishmentProgress
            punishmentLeaderboard = cache.punishmentLeaderboard
            leaderboardPunishment = cache.leaderboardPunishment
            isLoggedIn = true
            hasOnboarded = true
            print("[\(dashboardLog)] restored from cache")
        }
        print("[\(dashboardLog)] useSupabase=\(SupabaseConfig.isConfigured)")
    }

    var currentUserId: String {
        currentUserIdFromSession ?? ""
    }

    var currentUserDisplayName: String {
        currentUserDisplayNameStored ?? "You"
    }

    private var currentUserDisplayNameStored: String?
    func setCurrentUserDisplayName(_ name: String) { currentUserDisplayNameStored = name }

    func displayName(for userId: String) -> String {
        if userId.lowercased() == currentUserId.lowercased() { return currentUserDisplayName }
        return leaderboardLoaded.first(where: { $0.userId.lowercased() == userId.lowercased() })?.displayName ?? "Member"
    }

    var isAdmin: Bool {
        memberships.first { $0.userId.lowercased() == currentUserId.lowercased() }?.role == .admin
    }

    var hasGroup: Bool { groupId != nil }

    var group: Group {
        Group(id: groupId ?? "", name: groupName, inviteCode: groupInviteCode)
    }

    var activeWeek: ActiveWeek {
        if let w = activeWeekLoaded { return w }
        let placeholder = WeekAssignment(id: "", groupId: groupId ?? "", startDate: "", endDate: "", hostUserId: "")
        return ActiveWeek(weekAssignment: placeholder, challenge: nil, exercises: [], hostName: "")
    }

    var currentUserProgress: UserProgress {
        if let ch = challenge {
            return ProgressCalculations.calculateUserProgress(userId: currentUserId, logs: logs, challenge: ch, exercises: exercises, displayName: currentUserDisplayName)
        }
        return UserProgress(userId: currentUserId, displayName: currentUserDisplayName, cardioTotal: 0, cardioProgress: 0, strengthOverallProgress: 0, totalProgress: 0, exerciseTotals: [:])
    }

    var currentUserCardioBreakdown: [String: Double] {
        ProgressCalculations.userCardioBreakdown(userId: currentUserId, logs: logs)
    }

    var leaderboard: [UserProgress] {
        if !leaderboardLoaded.isEmpty { return leaderboardLoaded }
        if let ch = challenge {
            let participantIds = memberships.filter { $0.memberType == .participant }.map(\.userId)
            let list = participantIds.map { uid in
                ProgressCalculations.calculateUserProgress(userId: uid, logs: logs, challenge: ch, exercises: exercises, displayName: uid == currentUserId ? currentUserDisplayName : nil)
            }
            return list.sorted { $0.totalProgress > $1.totalProgress }
        }
        return []
    }

    var activityFeed: [ActivityFeedItem] { activityFeedLoaded }

    var exercises: [StrengthExercise] {
        activeWeek.exercises
    }

    var challenge: WeekChallenge? {
        activeWeek.challenge
    }

    var hasCurrentWeekAssignment: Bool { activeWeekLoaded != nil }

    var numberOfMembers: Int { memberships.count }
    private var participantCount: Int { memberships.filter { $0.memberType == .participant }.count }

    var groupCardioTotal: Double {
        guard let ch = challenge else { return 0 }
        return ProgressCalculations.groupCardioTotal(logs: logs, cardioTargetPerPerson: ch.cardioTarget)
    }
    var groupCardioTarget: Double {
        guard let ch = challenge else { return 0 }
        return ProgressCalculations.groupCardioTarget(numberOfMembers: max(participantCount, 1), cardioTargetPerPerson: ch.cardioTarget)
    }
    var groupCardioProgress: Double {
        guard let ch = challenge else { return 0 }
        return ProgressCalculations.groupCardioProgress(logs: logs, numberOfMembers: max(participantCount, 1), cardioTargetPerPerson: ch.cardioTarget)
    }
    var groupStrengthProgress: Double {
        guard let ch = challenge, !exercises.isEmpty else { return 0 }
        return ProgressCalculations.groupStrengthProgress(logs: logs, numberOfMembers: max(participantCount, 1), exercises: exercises)
    }
    var groupCardioBreakdown: [String: Double] { ProgressCalculations.groupCardioBreakdown(logs: logs) }
    var groupExerciseTotals: [String: Int] {
        guard let ch = challenge, !exercises.isEmpty else { return [:] }
        return ProgressCalculations.groupExerciseTotals(logs: logs, exercises: exercises)
    }
    var progressOverTimeChartPoints: [ProgressCalculations.ChartPoint] {
        guard let ch = challenge else { return [] }
        let memberIds = memberships.filter { $0.memberType == .participant }.map(\.userId)
        return ProgressCalculations.progressOverTime(logs: logs, weekStart: activeWeek.weekAssignment.startDate, weekEnd: activeWeek.weekAssignment.endDate, challenge: ch, exercises: exercises, memberIds: memberIds.isEmpty ? [currentUserId] : memberIds)
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

    /// Time remaining until punishment end date (for punishment progress card).
    static func punishmentTimeRemaining(endDate: String) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.timeZone = TimeZone.current
        guard let end = formatter.date(from: String(endDate.prefix(10))) else { return "" }
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

    /// Clears all group-related state (e.g. after current user leaves). Does not sign out.
    private func clearGroupState() {
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
        upcomingAssignmentForUser = nil
        activePunishment = nil
        punishmentLogs = []
        punishmentProgress = nil
        punishmentLeaderboard = []
        leaderboardPunishment = nil
        SessionCache.clear()
    }

    func signOut() {
        isLoggedIn = false
        hasOnboarded = false
        currentUserIdFromSession = nil
        currentUserDisplayNameStored = nil
        clearGroupState()
        if useSupabase {
            Task { try? await supabaseService?.signOut() }
        }
    }

    /// Call on launch when useSupabase to restore session and load user/group.
    func checkSession() async {
        guard useSupabase, let svc = supabaseService else {
            print("[\(dashboardLog)] checkSession skipped: useSupabase=\(useSupabase), hasService=\(supabaseService != nil)")
            return
        }
        authLoading = true
        defer { authLoading = false }
        do {
            let hasSession = await svc.session()
            print("[\(dashboardLog)] checkSession hasSession=\(hasSession)")
            if !hasSession {
                isLoggedIn = false
                currentUserIdFromSession = nil
                currentUserDisplayNameStored = nil
                groupId = nil
                hasOnboarded = false
                SessionCache.clear()
                print("[\(dashboardLog)] No session, signed out")
                return
            }
            if let uid = await svc.currentUserId {
                currentUserIdFromSession = uid
                isLoggedIn = true
                hasOnboarded = true  // Session = existing user; skip onboarding
                print("[\(dashboardLog)] currentUserId=\(uid.prefix(8))...")
                let profile = try? await svc.getProfile(userId: uid)
                if let profile { setCurrentUserDisplayName(profile.displayName) }
                if let (grp, mem) = try? await svc.getMembershipForUser(userId: uid) {
                    groupId = grp.id
                    groupName = grp.name
                    groupInviteCode = grp.inviteCode
                    print("[\(dashboardLog)] group=\(grp.name), id=\(grp.id.prefix(8))...")
                    memberships = try await svc.getGroupMemberships(groupId: grp.id)
                    print("[\(dashboardLog)] memberships=\(memberships.count), refreshing in background")
                    Task { await refresh() }
                } else {
                    clearGroupState()
                    print("[\(dashboardLog)] No group membership, skipping onboarding")
                }
            } else {
                print("[\(dashboardLog)] currentUserId nil after session")
            }
        } catch {
            loadError = error.localizedDescription
            print("[\(dashboardLog)] checkSession error: \(error)")
        }
    }

    /// Sign in with email/password (Supabase only).
    func signIn(email: String, password: String) async throws {
        guard useSupabase, let svc = supabaseService else { return }
        try await svc.signIn(email: email, password: password)
        if let uid = await svc.currentUserId {
            currentUserIdFromSession = uid
            isLoggedIn = true
            hasOnboarded = true  // Sign-in = existing user; skip onboarding
            if let profile = try? await svc.getProfile(userId: uid) {
                setCurrentUserDisplayName(profile.displayName)
            }
            if let (grp, mem) = try? await svc.getMembershipForUser(userId: uid) {
                groupId = grp.id
                groupName = grp.name
                groupInviteCode = grp.inviteCode
                memberships = try await svc.getGroupMemberships(groupId: grp.id)
                hasOnboarded = true
                Task { await refresh() }
            }
        }
    }

    /// Sign up with email/password (Supabase only).
    func signUp(email: String, password: String, displayName: String? = nil) async throws {
        guard useSupabase, let svc = supabaseService else { return }
        try await svc.signUp(email: email, password: password, displayName: displayName)
        if let uid = await svc.currentUserId {
            currentUserIdFromSession = uid
            isLoggedIn = true
            // Display name was collected in sign-up form; skip onboarding
            hasOnboarded = true
        }
    }

    /// Load group data from Supabase (when we have groupId).
    func refresh() async {
        guard useSupabase, let svc = supabaseService, let gid = groupId else {
            print("[\(dashboardLog)] refresh skipped: gid=\(groupId ?? "nil")")
            return
        }
        isLoading = true
        loadError = nil
        print("[\(dashboardLog)] refresh() start for group=\(gid.prefix(8))...")
        defer { isLoading = false }
        let uid = currentUserId
        do {
            // Wave 1: parallel fetches that only need groupId
            async let membershipsTask = svc.getGroupMemberships(groupId: gid)
            async let activeWeekTask = svc.getActiveWeek(groupId: gid)
            async let leaderboardTask = svc.getLeaderboard(groupId: gid)
            async let activityFeedTask = svc.getActivityFeed(groupId: gid, limit: 50)
            async let punishmentsTask = svc.getAllPunishments(groupId: gid)
            async let activePunishmentTask = svc.getActivePunishmentForUser(userId: uid, groupId: gid)

            memberships = try await membershipsTask
            print("[\(dashboardLog)] refresh memberships=\(memberships.count)")
            activeWeekLoaded = try await activeWeekTask
            let hasWeek = activeWeekLoaded != nil
            let hasChallenge = activeWeekLoaded?.challenge != nil
            print("[\(dashboardLog)] refresh activeWeek=\(hasWeek), challenge=\(hasChallenge)")
            leaderboardLoaded = try await leaderboardTask
            print("[\(dashboardLog)] refresh leaderboard=\(leaderboardLoaded.count)")
            activityFeedLoaded = try await activityFeedTask
            print("[\(dashboardLog)] refresh activityFeed=\(activityFeedLoaded.count)")
            punishments = try await punishmentsTask
            activePunishment = try? await activePunishmentTask

            // Wave 2: parallel fetches that depend on activeWeek
            async let upcomingTask = svc.getUpcomingAssignments(groupId: gid, excludeAssignmentId: activeWeekLoaded?.weekAssignment.id)
            let logsTask: Task<[WorkoutLog], Error> = Task {
                if let ch = activeWeekLoaded?.challenge {
                    return try await svc.getWorkoutLogs(weekChallengeId: ch.id, userId: nil)
                }
                return []
            }

            upcomingAssignmentsLoaded = try await upcomingTask
            logs = (try? await logsTask.value) ?? []
            print("[\(dashboardLog)] refresh logs=\(logs.count)")

            // Upcoming host banner: assignment where user is host, within 3 days, no challenge yet
            if let assignment = try? await svc.getUpcomingAssignmentForUser(userId: uid, groupId: gid, daysAhead: 3) {
                let result = try? await svc.getChallengeForAssignment(assignmentId: assignment.id)
                let (challenge, _) = result ?? (nil, [])
                upcomingAssignmentForUser = challenge == nil ? assignment : nil
            } else {
                upcomingAssignmentForUser = nil
            }

            // Wave 3: punishment details (depend on activePunishment or punishments)
            if let ap = activePunishment {
                async let punishmentLogsTask = svc.getPunishmentLogs(punishmentId: ap.punishment.id)
                async let punishmentProgressTask = svc.getUserPunishmentProgress(userId: uid, punishmentId: ap.punishment.id)
                async let punishmentLeaderboardTask = svc.getPunishmentLeaderboard(punishmentId: ap.punishment.id)
                punishmentLogs = (try? await punishmentLogsTask) ?? []
                punishmentProgress = try? await punishmentProgressTask
                punishmentLeaderboard = (try? await punishmentLeaderboardTask) ?? []
                leaderboardPunishment = ap
            } else {
                punishmentLogs = []
                punishmentProgress = nil
                punishmentLeaderboard = []
                let formatter = DateFormatter()
                formatter.dateFormat = "yyyy-MM-dd"
                let today = formatter.string(from: Date())
                if let active = punishments.first(where: { today >= $0.startDate && today <= $0.endDate }) {
                    async let leaderboardTask = svc.getPunishmentLeaderboard(punishmentId: active.id)
                    async let exercisesTask = svc.getPunishmentExercises(punishmentId: active.id)
                    async let logsTask = svc.getPunishmentLogs(punishmentId: active.id)
                    punishmentLeaderboard = (try? await leaderboardTask) ?? []
                    let exs = (try? await exercisesTask) ?? []
                    leaderboardPunishment = ActivePunishment(punishment: active, exercises: exs, assignedUserIds: active.assignedUserIds)
                    punishmentLogs = (try? await logsTask) ?? []
                } else {
                    leaderboardPunishment = nil
                }
            }
            saveToCache()
            print("[\(dashboardLog)] refresh done")
        } catch {
            loadError = error.localizedDescription
            print("[\(dashboardLog)] refresh error: \(error)")
        }
    }

    private func saveToCache() {
        guard let gid = groupId, !gid.isEmpty, let uid = currentUserIdFromSession, !uid.isEmpty else { return }
        var cache = SessionCache(
            currentUserId: uid,
            currentUserDisplayName: currentUserDisplayNameStored ?? "You",
            groupId: gid,
            groupName: groupName,
            groupInviteCode: groupInviteCode,
            memberships: memberships,
            activeWeek: activeWeekLoaded,
            logs: logs,
            leaderboard: leaderboardLoaded,
            activityFeed: activityFeedLoaded,
            upcomingAssignments: upcomingAssignmentsLoaded,
            punishments: punishments,
            activePunishment: activePunishment,
            punishmentLogs: punishmentLogs,
            punishmentProgress: punishmentProgress,
            punishmentLeaderboard: punishmentLeaderboard,
            leaderboardPunishment: leaderboardPunishment
        )
        cache.save()
    }

    // MARK: - Mutations

    /// completion(success) is called when done; call with true on success so UI can dismiss, false on error so isSaving is cleared.
    func addLog(_ log: WorkoutLog, completion: (@Sendable (Bool) -> Void)? = nil) {
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
                    await MainActor.run { completion?(true) }
                    await refresh()
                } catch {
                    await MainActor.run { loadError = error.localizedDescription }
                    await MainActor.run { completion?(false) }
                }
            }
            return
        }
        completion?(false)
    }

    /// Add a punishment log (for users with active punishment). completion(success).
    func addPunishmentLog(punishmentId: String, loggedAt: String, logType: LogType, cardioActivity: CardioActivity?, cardioAmount: Double?, exerciseId: String?, strengthReps: Int?, completion: (@Sendable (Bool) -> Void)? = nil) {
        guard useSupabase, let svc = supabaseService, let gid = groupId else {
            completion?(false)
            return
        }
        Task {
            do {
                _ = try await svc.createPunishmentLog(
                    groupId: gid,
                    punishmentId: punishmentId,
                    userId: currentUserId,
                    loggedAt: loggedAt,
                    logType: logType,
                    cardioActivity: cardioActivity,
                    cardioAmount: cardioAmount,
                    exerciseId: exerciseId,
                    strengthReps: strengthReps,
                    note: nil
                )
                await MainActor.run { completion?(true) }
                await refresh()
            } catch {
                await MainActor.run { loadError = error.localizedDescription }
                await MainActor.run { completion?(false) }
            }
        }
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
        logs.removeAll { $0.id == logId }
        if useSupabase, let svc = supabaseService {
            do {
                try await svc.deleteWorkoutLog(logId: logId)
                saveToCache()
            } catch {
                await MainActor.run { loadError = error.localizedDescription }
                await refresh()
            }
        }
    }

    func updateGroupName(_ name: String) {
        groupName = name
        if useSupabase, let svc = supabaseService, let gid = groupId {
            Task {
                try? await svc.updateGroupName(groupId: gid, name: name)
                await refresh()
            }
        }
    }

    func removeMember(userId: String) {
        let isLeavingSelf = userId.lowercased() == currentUserId.lowercased()
        if !isLeavingSelf {
            memberships.removeAll { $0.userId.lowercased() == userId.lowercased() }
        }
        if useSupabase, let svc = supabaseService, let gid = groupId {
            Task {
                do {
                    try await svc.removeMember(groupId: gid, userId: userId)
                    if isLeavingSelf {
                        await MainActor.run { clearGroupState() }
                    } else {
                        await refresh()
                    }
                } catch {
                    if !isLeavingSelf {
                        await refresh()
                    }
                    await MainActor.run { loadError = error.localizedDescription }
                }
            }
            return
        }
        if isLeavingSelf {
            clearGroupState()
        }
    }

    func updateMemberType(userId: String, memberType: MemberType) {
        guard let i = memberships.firstIndex(where: { $0.userId == userId }) else { return }
        memberships[i].memberType = memberType
        if useSupabase, let svc = supabaseService, let gid = groupId {
            Task {
                try? await svc.updateMemberType(groupId: gid, userId: userId, memberType: memberType)
                await refresh()
            }
        }
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
        }
    }

    func deletePunishment(id: String) {
        punishments.removeAll { $0.id == id }
        if useSupabase, let svc = supabaseService {
            Task {
                try? await svc.deletePunishment(punishmentId: id)
                await refresh()
            }
        }
    }

    func updateMyDisplayName(_ name: String) {
        if useSupabase, let svc = supabaseService {
            setCurrentUserDisplayName(name)
            Task {
                try? await svc.updateProfile(userId: currentUserId, displayName: name)
            }
            return
        }
        setCurrentUserDisplayName(name)
    }

    var upcomingAssignments: [WeekAssignment] {
        upcomingAssignmentsLoaded
    }

    func updateCurrentWeekDates(start: String, end: String) {
        guard useSupabase, let svc = supabaseService, let aid = activeWeekLoaded?.weekAssignment.id else { return }
        Task {
            try? await svc.updateWeekAssignment(assignmentId: aid, hostUserId: activeWeekLoaded!.weekAssignment.hostUserId, assignedBy: currentUserId, startDate: start, endDate: end)
            await refresh()
        }
    }

    func updateCurrentWeekHost(userId: String) {
        guard useSupabase, let svc = supabaseService, let aid = activeWeekLoaded?.weekAssignment.id else { return }
        Task {
            try? await svc.updateWeekAssignment(assignmentId: aid, hostUserId: userId, assignedBy: currentUserId, startDate: nil, endDate: nil)
            await refresh()
        }
    }

    func updateChallenge(cardioMetric: CardioMetric? = nil, cardioTarget: Double? = nil) {
        guard useSupabase, let svc = supabaseService, let ch = activeWeekLoaded?.challenge else { return }
        let metric = cardioMetric ?? ch.cardioMetric
        let target = cardioTarget ?? ch.cardioTarget
        let exs = activeWeekLoaded!.exercises.map { (id: $0.id as String?, name: $0.name, targetReps: $0.targetReps) }
        Task {
            try? await svc.updateWeekChallenge(challengeId: ch.id, cardioMetric: metric, cardioTarget: target, exercises: exs)
            await refresh()
        }
    }

    func addExercise(name: String, targetReps: Int) {
        guard useSupabase, let svc = supabaseService, let ch = activeWeekLoaded?.challenge else { return }
        let exs = activeWeekLoaded!.exercises.map { (id: $0.id as String?, name: $0.name, targetReps: $0.targetReps) } + [(id: nil as String?, name: name, targetReps: targetReps)]
        Task {
            try? await svc.updateWeekChallenge(challengeId: ch.id, cardioMetric: ch.cardioMetric, cardioTarget: ch.cardioTarget, exercises: exs)
            await refresh()
        }
    }

    func removeExercise(id: String) {
        guard useSupabase, let svc = supabaseService, let ch = activeWeekLoaded?.challenge else { return }
        let exs = activeWeekLoaded!.exercises.filter { $0.id != id }.map { (id: $0.id as String?, name: $0.name, targetReps: $0.targetReps) }
        Task {
            try? await svc.updateWeekChallenge(challengeId: ch.id, cardioMetric: ch.cardioMetric, cardioTarget: ch.cardioTarget, exercises: exs)
            await refresh()
        }
    }

    func updateExercise(id: String, name: String? = nil, targetReps: Int? = nil) {
        guard useSupabase, let svc = supabaseService, let ch = activeWeekLoaded?.challenge else { return }
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
        guard useSupabase, let svc = supabaseService, let gid = groupId else { return }
        Task {
            _ = try? await svc.createWeekAssignment(groupId: gid, startDate: startDate, endDate: endDate, hostUserId: hostUserId, assignedBy: currentUserId)
            await refresh()
        }
    }

    /// Create a challenge for the current week (when week exists but has no challenge). Admin only.
    func createChallenge(cardioMetric: CardioMetric, cardioTarget: Double, exercises: [(name: String, targetReps: Int)]) {
        guard useSupabase, let svc = supabaseService, let gid = groupId,
              let assignment = activeWeekLoaded?.weekAssignment,
              activeWeekLoaded?.challenge == nil else { return }
        Task {
            _ = try? await svc.createWeekChallenge(groupId: gid, weekAssignmentId: assignment.id, createdBy: currentUserId, cardioMetric: cardioMetric, cardioTarget: cardioTarget, exercises: exercises)
            await refresh()
        }
    }

    /// Fetch challenge and exercises for an assignment. Returns nil if no challenge exists.
    func getChallengeForAssignment(assignmentId: String) async -> (WeekChallenge, [StrengthExercise])? {
        guard let svc = supabaseService else { return nil }
        let result = try? await svc.getChallengeForAssignment(assignmentId: assignmentId)
        let (ch, exs) = result ?? (nil, [])
        guard let ch = ch else { return nil }
        return (ch, exs)
    }

    /// Create challenge for a specific assignment (e.g. upcoming week). Used when user taps "You're the host" banner.
    func createChallengeForAssignment(assignmentId: String, cardioMetric: CardioMetric, cardioTarget: Double, exercises: [(name: String, targetReps: Int)]) {
        guard useSupabase, let svc = supabaseService, let gid = groupId else { return }
        Task {
            _ = try? await svc.createWeekChallenge(groupId: gid, weekAssignmentId: assignmentId, createdBy: currentUserId, cardioMetric: cardioMetric, cardioTarget: cardioTarget, exercises: exercises)
            await refresh()
        }
    }

    /// Update challenge for a specific assignment (e.g. upcoming week). Used when host edits exercises in Group settings.
    func updateChallengeForAssignment(assignmentId: String, cardioMetric: CardioMetric, cardioTarget: Double, exercises: [(name: String, targetReps: Int)]) {
        guard useSupabase, let svc = supabaseService else { return }
        Task {
            let result = try? await svc.getChallengeForAssignment(assignmentId: assignmentId)
            let (ch, _) = result ?? (nil, [])
            guard let ch = ch else { return }
            let exs = exercises.map { (id: nil as String?, name: $0.name, targetReps: $0.targetReps) }
            try? await svc.updateWeekChallenge(challengeId: ch.id, cardioMetric: cardioMetric, cardioTarget: cardioTarget, exercises: exs)
            await refresh()
        }
    }

    /// Delete the current week assignment (admin). Refreshes after delete.
    func deleteCurrentWeekAssignment() {
        guard useSupabase, let svc = supabaseService, let aid = activeWeekLoaded?.weekAssignment.id else { return }
        Task {
            try? await svc.deleteWeekAssignment(assignmentId: aid)
            await refresh()
        }
    }

    func removeUpcomingAssignment(id: String) {
        guard useSupabase, let svc = supabaseService else { return }
        Task {
            try? await svc.deleteWeekAssignment(assignmentId: id)
            await refresh()
        }
    }

    func updateUpcomingAssignment(id: String, hostUserId: String? = nil, startDate: String? = nil, endDate: String? = nil) {
        guard useSupabase, let svc = supabaseService else { return }
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

    /// Join group by invite code (Supabase). On success sets groupId and refreshes. Invite code is trimmed and uppercased to match create flow.
    func joinGroup(inviteCode: String) async throws {
        guard useSupabase, let svc = supabaseService else { return }
        let code = inviteCode.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()
        let grp = try await svc.joinGroupByInviteCode(inviteCode: code, userId: currentUserId)
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
