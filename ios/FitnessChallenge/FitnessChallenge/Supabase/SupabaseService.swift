//
//  SupabaseService.swift
//  FitnessChallenge
//
//  Supabase client and API methods matching the web app's queries.
//

import Foundation
import Supabase

// MARK: - DTOs (snake_case from API)

private struct ProfileDTO: Decodable {
    let id: String
    let display_name: String
    let created_at: String?
}

private struct GroupDTO: Decodable {
    let id: String
    let name: String
    let invite_code: String
    let created_by: String
    let created_at: String?
}

private struct GroupMembershipDTO: Decodable {
    let id: String
    let group_id: String
    let user_id: String
    let role: String
    let member_type: String?
    let created_at: String?
}

private struct WeekAssignmentDTO: Decodable {
    let id: String
    let group_id: String
    let start_date: String
    let end_date: String
    let host_user_id: String
    let assigned_by: String?
    let created_at: String?
}

private struct StrengthExerciseDTO: Decodable {
    let id: String
    let week_challenge_id: String
    let name: String
    let target_reps: Int
    let sort_order: Int
    let created_at: String?
}

private struct WeekChallengeDTO: Decodable {
    let id: String
    let group_id: String
    let week_assignment_id: String
    let created_by: String
    let cardio_metric: String
    let cardio_target: Double
    let created_at: String?
}

private struct WorkoutLogDTO: Decodable {
    let id: String
    let group_id: String
    let week_challenge_id: String
    let user_id: String
    let logged_at: String
    let created_at: String
    let log_type: String
    let cardio_activity: String?
    let cardio_amount: Double?
    let exercise_id: String?
    let strength_reps: Int?
    let note: String?
}

private struct PunishmentDTO: Decodable {
    let id: String
    let group_id: String
    let assigned_by: String
    let start_date: String
    let end_date: String
    let cardio_metric: String?
    let cardio_target: Double?
    let created_at: String?
}

private struct PunishmentExerciseDTO: Decodable {
    let id: String
    let punishment_id: String
    let name: String
    let target_reps: Int
    let sort_order: Int
}

private struct PunishmentAssignmentDTO: Decodable {
    let user_id: String
}

// MARK: - Encodable payloads (snake_case for API)

private struct GroupInsert: Encodable {
    let name: String
    let invite_code: String
    let created_by: String
}

private struct MembershipInsert: Encodable {
    let group_id: String
    let user_id: String
    let role: String
}

private struct WeekAssignmentInsert: Encodable {
    let group_id: String
    let start_date: String
    let end_date: String
    let host_user_id: String
    let assigned_by: String
}

private struct WeekAssignmentUpdate: Encodable {
    let host_user_id: String
    let assigned_by: String
    var start_date: String?
    var end_date: String?
}

private struct WeekChallengeInsert: Encodable {
    let group_id: String
    let week_assignment_id: String
    let created_by: String
    let cardio_metric: String
    let cardio_target: Double
}

private struct StrengthExerciseInsert: Encodable {
    let week_challenge_id: String
    let name: String
    let target_reps: Int
    let sort_order: Int
}

private struct WeekChallengeUpdate: Encodable {
    let cardio_metric: String
    let cardio_target: Double
}

private struct WorkoutLogInsert: Encodable {
    let group_id: String
    let week_challenge_id: String
    let user_id: String
    let logged_at: String
    let log_type: String
    var cardio_activity: String?
    var cardio_amount: Double?
    var exercise_id: String?
    var strength_reps: Int?
    var note: String?
}

private struct PunishmentInsert: Encodable {
    let group_id: String
    let assigned_by: String
    let start_date: String
    let end_date: String
    var cardio_metric: String?
    var cardio_target: Double?
}

private struct PunishmentAssignmentInsert: Encodable {
    let punishment_id: String
    let user_id: String
}

private struct PunishmentExerciseInsert: Encodable {
    let punishment_id: String
    let name: String
    let target_reps: Int
    let sort_order: Int
}

private struct PunishmentUpdate: Encodable {
    let start_date: String
    let end_date: String
    var cardio_metric: String?
    var cardio_target: Double?
}

private struct ProfileUpdate: Encodable {
    let display_name: String
}

// MARK: - Service

@MainActor
final class SupabaseService {
    private let client: SupabaseClient
    private let decoder: JSONDecoder = {
        let d = JSONDecoder()
        d.keyDecodingStrategy = .convertFromSnakeCase
        d.dateDecodingStrategy = .iso8601
        return d
    }()

    init(url: URL, anonKey: String) {
        let options = SupabaseClientOptions(
            auth: SupabaseClientOptions.AuthOptions(emitLocalSessionAsInitialSession: true)
        )
        client = SupabaseClient(supabaseURL: url, supabaseKey: anonKey, options: options)
    }

    // MARK: - Auth

    var currentUserId: String? {
        get async {
            (try? await client.auth.session.user)?.id.uuidString
        }
    }

    func signIn(email: String, password: String) async throws {
        _ = try await client.auth.signIn(email: email, password: password)
    }

    func signUp(email: String, password: String) async throws {
        _ = try await client.auth.signUp(email: email, password: password)
    }

    func signOut() async throws {
        try await client.auth.signOut()
    }

    func session() async -> Bool {
        (try? await client.auth.session) != nil
    }

    // MARK: - Profile

    func getProfile(userId: String) async throws -> Profile? {
        let dto: ProfileDTO = try await client.from("profiles")
            .select()
            .eq("id", value: userId)
            .single()
            .execute()
            .value
        return Profile(id: dto.id, displayName: dto.display_name)
    }

    func updateProfile(userId: String, displayName: String) async throws {
        try await client.from("profiles")
            .update(ProfileUpdate(display_name: displayName))
            .eq("id", value: userId)
            .execute()
    }

    // MARK: - Group & membership

    func getGroup(groupId: String) async throws -> Group? {
        let dto: GroupDTO = try await client.from("groups")
            .select()
            .eq("id", value: groupId)
            .single()
            .execute()
            .value
        return Group(id: dto.id, name: dto.name, inviteCode: dto.invite_code)
    }

    func createGroup(name: String, inviteCode: String, userId: String) async throws -> Group {
        let dto: GroupDTO = try await client.from("groups")
            .insert(GroupInsert(name: name, invite_code: inviteCode, created_by: userId))
            .select()
            .single()
            .execute()
            .value
        try await client.from("group_memberships")
            .insert(MembershipInsert(group_id: dto.id, user_id: userId, role: "admin"))
            .execute()
        return Group(id: dto.id, name: dto.name, inviteCode: dto.invite_code)
    }

    func joinGroupByInviteCode(inviteCode: String, userId: String) async throws -> Group {
        let dto: GroupDTO = try await client.from("groups")
            .select()
            .eq("invite_code", value: inviteCode)
            .single()
            .execute()
            .value
        try await client.from("group_memberships")
            .insert(MembershipInsert(group_id: dto.id, user_id: userId, role: "member"))
            .execute()
        return Group(id: dto.id, name: dto.name, inviteCode: dto.invite_code)
    }

    func updateGroupName(groupId: String, name: String) async throws {
        struct NameUpdate: Encodable { let name: String }
        try await client.from("groups")
            .update(NameUpdate(name: name))
            .eq("id", value: groupId)
            .execute()
    }

    func getGroupMemberships(groupId: String) async throws -> [GroupMembership] {
        let list: [GroupMembershipDTO] = try await client.from("group_memberships")
            .select()
            .eq("group_id", value: groupId)
            .execute()
            .value
        return list.map { m in
            GroupMembership(
                id: m.id,
                groupId: m.group_id,
                userId: m.user_id,
                role: UserRole(rawValue: m.role) ?? .member,
                memberType: (m.member_type.flatMap { MemberType(rawValue: $0) }) ?? .participant
            )
        }
    }

    func getMembershipForUser(userId: String) async throws -> (Group, GroupMembership)? {
        struct Row: Decodable {
            let id: String
            let group_id: String
            let user_id: String
            let role: String
            let member_type: String?
            let groups: GroupDTO?
        }
        let rows: [Row] = try await client.from("group_memberships")
            .select("*, groups(*)")
            .eq("user_id", value: userId)
            .limit(1)
            .execute()
            .value
        guard let row = rows.first, let g = row.groups else { return nil }
        let group = Group(id: g.id, name: g.name, inviteCode: g.invite_code)
        let membership = GroupMembership(
            id: row.id,
            groupId: row.group_id,
            userId: row.user_id,
            role: UserRole(rawValue: row.role) ?? .member,
            memberType: (row.member_type.flatMap { MemberType(rawValue: $0) }) ?? .participant
        )
        return (group, membership)
    }

    func removeMember(groupId: String, userId: String) async throws {
        try await client.from("group_memberships")
            .delete()
            .eq("group_id", value: groupId)
            .eq("user_id", value: userId)
            .execute()
    }

    func updateMemberType(groupId: String, userId: String, memberType: MemberType) async throws {
        struct MemberTypeUpdate: Encodable { let member_type: String }
        try await client.from("group_memberships")
            .update(MemberTypeUpdate(member_type: memberType.rawValue))
            .eq("group_id", value: groupId)
            .eq("user_id", value: userId)
            .execute()
    }

    // MARK: - Local date

    private static func localDateString() -> String {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.timeZone = TimeZone.current
        return f.string(from: Date())
    }

    // MARK: - Active week

    func getActiveWeek(groupId: String) async throws -> ActiveWeek? {
        let today = Self.localDateString()
        let assignments: [WeekAssignmentDTO] = try await client.from("week_assignments")
            .select()
            .eq("group_id", value: groupId)
            .lte("start_date", value: today)
            .gte("end_date", value: today)
            .order("start_date", ascending: false)
            .limit(1)
            .execute()
            .value
        guard let a = assignments.first else { return nil }
        let startDate = String(a.start_date.prefix(10))
        let endDate = String(a.end_date.prefix(10))
        let assignment = WeekAssignment(
            id: a.id,
            groupId: a.group_id,
            startDate: startDate,
            endDate: endDate,
            hostUserId: a.host_user_id
        )
        var hostName = "Unknown"
        if let p = try? await getProfile(userId: a.host_user_id) {
            hostName = p.displayName
        }
        var challenge: WeekChallenge?
        var exercises: [StrengthExercise] = []
        let challenges: [WeekChallengeDTO] = try await client.from("week_challenges")
            .select()
            .eq("week_assignment_id", value: a.id)
            .limit(1)
            .execute()
            .value
        if let c = challenges.first {
            challenge = WeekChallenge(
                id: c.id,
                groupId: c.group_id,
                weekAssignmentId: c.week_assignment_id,
                cardioMetric: CardioMetric(rawValue: c.cardio_metric) ?? .miles,
                cardioTarget: c.cardio_target
            )
            let exResponse: PostgrestResponse<[StrengthExerciseDTO]> = try await client.from("strength_exercises")
                .select()
                .eq("week_challenge_id", value: c.id)
                .order("sort_order")
                .execute()
            let exList = exResponse.value
            exercises = exList.map { e in
                StrengthExercise(id: e.id, weekChallengeId: e.week_challenge_id, name: e.name, targetReps: e.target_reps, sortOrder: e.sort_order)
            }
        }
        return ActiveWeek(weekAssignment: assignment, challenge: challenge, exercises: exercises, hostName: hostName)
    }

    func getUpcomingAssignments(groupId: String, excludeAssignmentId: String?) async throws -> [WeekAssignment] {
        let today = Self.localDateString()
        var query = client.from("week_assignments")
            .select()
            .eq("group_id", value: groupId)
            .gte("start_date", value: today)
        if let ex = excludeAssignmentId {
            query = query.neq("id", value: ex)
        }
        let list: [WeekAssignmentDTO] = try await query.order("start_date", ascending: true).execute().value
        return list.map { a in
            WeekAssignment(
                id: a.id,
                groupId: a.group_id,
                startDate: String(a.start_date.prefix(10)),
                endDate: String(a.end_date.prefix(10)),
                hostUserId: a.host_user_id
            )
        }
    }

    func createWeekAssignment(groupId: String, startDate: String, endDate: String, hostUserId: String, assignedBy: String) async throws -> WeekAssignment {
        let dto: WeekAssignmentDTO = try await client.from("week_assignments")
            .insert(WeekAssignmentInsert(group_id: groupId, start_date: String(startDate.prefix(10)), end_date: String(endDate.prefix(10)), host_user_id: hostUserId, assigned_by: assignedBy))
            .select()
            .single()
            .execute()
            .value
        return WeekAssignment(id: dto.id, groupId: dto.group_id, startDate: String(dto.start_date.prefix(10)), endDate: String(dto.end_date.prefix(10)), hostUserId: dto.host_user_id)
    }

    func updateWeekAssignment(assignmentId: String, hostUserId: String, assignedBy: String, startDate: String?, endDate: String?) async throws {
        var payload = WeekAssignmentUpdate(host_user_id: hostUserId, assigned_by: assignedBy, start_date: nil, end_date: nil)
        payload.start_date = startDate.map { String($0.prefix(10)) }
        payload.end_date = endDate.map { String($0.prefix(10)) }
        try await client.from("week_assignments")
            .update(payload)
            .eq("id", value: assignmentId)
            .execute()
    }

    func deleteWeekAssignment(assignmentId: String) async throws {
        try await client.from("week_assignments")
            .delete()
            .eq("id", value: assignmentId)
            .execute()
    }

    // MARK: - Week challenge & exercises

    func getChallengeForAssignment(assignmentId: String) async throws -> (WeekChallenge?, [StrengthExercise]) {
        let challenges: [WeekChallengeDTO] = try await client.from("week_challenges")
            .select()
            .eq("week_assignment_id", value: assignmentId)
            .limit(1)
            .execute()
            .value
        guard let c = challenges.first else { return (nil, []) }
        let challenge = WeekChallenge(
            id: c.id,
            groupId: c.group_id,
            weekAssignmentId: c.week_assignment_id,
            cardioMetric: CardioMetric(rawValue: c.cardio_metric) ?? .miles,
            cardioTarget: c.cardio_target
        )
        let exResponse: PostgrestResponse<[StrengthExerciseDTO]> = try await client.from("strength_exercises")
            .select()
            .eq("week_challenge_id", value: c.id)
            .order("sort_order")
            .execute()
        let exList = exResponse.value
        let exercises = exList.map { e in
            StrengthExercise(id: e.id, weekChallengeId: e.week_challenge_id, name: e.name, targetReps: e.target_reps, sortOrder: e.sort_order)
        }
        return (challenge, exercises)
    }

    func createWeekChallenge(groupId: String, weekAssignmentId: String, createdBy: String, cardioMetric: CardioMetric, cardioTarget: Double, exercises: [(name: String, targetReps: Int)]) async throws -> (WeekChallenge, [StrengthExercise]) {
        let cDto: WeekChallengeDTO = try await client.from("week_challenges")
            .insert(WeekChallengeInsert(group_id: groupId, week_assignment_id: weekAssignmentId, created_by: createdBy, cardio_metric: cardioMetric.rawValue, cardio_target: cardioTarget))
            .select()
            .single()
            .execute()
            .value
        let challenge = WeekChallenge(
            id: cDto.id,
            groupId: cDto.group_id,
            weekAssignmentId: cDto.week_assignment_id,
            cardioMetric: CardioMetric(rawValue: cDto.cardio_metric) ?? .miles,
            cardioTarget: cDto.cardio_target
        )
        for (i, e) in exercises.enumerated() {
            try await client.from("strength_exercises")
                .insert(StrengthExerciseInsert(week_challenge_id: cDto.id, name: e.name, target_reps: e.targetReps, sort_order: i + 1))
                .execute()
        }
        let (_, exList) = try await getChallengeForAssignment(assignmentId: weekAssignmentId)
        return (challenge, exList)
    }

    func updateWeekChallenge(challengeId: String, cardioMetric: CardioMetric, cardioTarget: Double, exercises: [(id: String?, name: String, targetReps: Int)]) async throws {
        try await client.from("week_challenges")
            .update(WeekChallengeUpdate(cardio_metric: cardioMetric.rawValue, cardio_target: cardioTarget))
            .eq("id", value: challengeId)
            .execute()
        try await client.from("strength_exercises")
            .delete()
            .eq("week_challenge_id", value: challengeId)
            .execute()
        for (i, e) in exercises.enumerated() {
            try await client.from("strength_exercises")
                .insert(StrengthExerciseInsert(week_challenge_id: challengeId, name: e.name, target_reps: e.targetReps, sort_order: i + 1))
                .execute()
        }
    }

    // MARK: - Workout logs

    func getWorkoutLogs(weekChallengeId: String, userId: String?) async throws -> [WorkoutLog] {
        var query = client.from("workout_logs")
            .select()
            .eq("week_challenge_id", value: weekChallengeId)
        if let uid = userId {
            query = query.eq("user_id", value: uid)
        }
        let list: [WorkoutLogDTO] = try await query.order("created_at", ascending: false).execute().value
        return list.map { log in
            WorkoutLog(
                id: log.id,
                groupId: log.group_id,
                weekChallengeId: log.week_challenge_id,
                userId: log.user_id,
                loggedAt: String(log.logged_at.prefix(10)),
                logType: LogType(rawValue: log.log_type) ?? .cardio,
                cardioActivity: log.cardio_activity.flatMap { CardioActivity(rawValue: $0) },
                cardioAmount: log.cardio_amount,
                exerciseId: log.exercise_id,
                strengthReps: log.strength_reps,
                note: log.note
            )
        }
    }

    func createWorkoutLog(groupId: String, weekChallengeId: String, userId: String, loggedAt: String, logType: LogType, cardioActivity: CardioActivity?, cardioAmount: Double?, exerciseId: String?, strengthReps: Int?, note: String?) async throws -> WorkoutLog {
        var insert = WorkoutLogInsert(
            group_id: groupId,
            week_challenge_id: weekChallengeId,
            user_id: userId,
            logged_at: loggedAt,
            log_type: logType.rawValue,
            cardio_activity: nil,
            cardio_amount: nil,
            exercise_id: nil,
            strength_reps: nil,
            note: nil
        )
        if logType == .cardio {
            insert.cardio_activity = cardioActivity?.rawValue
            insert.cardio_amount = cardioAmount
        } else {
            insert.exercise_id = exerciseId
            insert.strength_reps = strengthReps
        }
        insert.note = note
        let dto: WorkoutLogDTO = try await client.from("workout_logs")
            .insert(insert)
            .select()
            .single()
            .execute()
            .value
        return WorkoutLog(
            id: dto.id,
            groupId: dto.group_id,
            weekChallengeId: dto.week_challenge_id,
            userId: dto.user_id,
            loggedAt: String(dto.logged_at.prefix(10)),
            logType: LogType(rawValue: dto.log_type) ?? .cardio,
            cardioActivity: dto.cardio_activity.flatMap { CardioActivity(rawValue: $0) },
            cardioAmount: dto.cardio_amount,
            exerciseId: dto.exercise_id,
            strengthReps: dto.strength_reps,
            note: dto.note
        )
    }

    func updateWorkoutLog(logId: String, cardioAmount: Double? = nil, strengthReps: Int? = nil) async throws {
        if let amount = cardioAmount {
            struct CardioUpdate: Encodable { let cardio_amount: Double }
            try await client.from("workout_logs").update(CardioUpdate(cardio_amount: amount)).eq("id", value: logId).execute()
        }
        if let reps = strengthReps {
            struct StrengthUpdate: Encodable { let strength_reps: Int }
            try await client.from("workout_logs").update(StrengthUpdate(strength_reps: reps)).eq("id", value: logId).execute()
        }
    }

    func deleteWorkoutLog(logId: String) async throws {
        try await client.from("workout_logs").delete().eq("id", value: logId).execute()
    }

    // MARK: - Leaderboard & progress

    func getLeaderboard(groupId: String) async throws -> [UserProgress] {
        guard let week = try await getActiveWeek(groupId: groupId), let challenge = week.challenge else { return [] }
        let memberships = try await getGroupMemberships(groupId: groupId)
        let participantIds = memberships.filter { $0.memberType == .participant }.map(\.userId)
        if participantIds.isEmpty { return [] }
        let logs: [WorkoutLogDTO] = try await client.from("workout_logs")
            .select()
            .eq("week_challenge_id", value: challenge.id)
            .in("user_id", values: participantIds)
            .execute()
            .value
        let exResponse: PostgrestResponse<[StrengthExerciseDTO]> = try await client.from("strength_exercises")
            .select()
            .eq("week_challenge_id", value: challenge.id)
            .order("sort_order")
            .execute()
        let exercises = exResponse.value
        var profileCache: [String: String] = [:]
        for uid in participantIds {
            if let p = try? await getProfile(userId: uid) { profileCache[uid] = p.displayName }
        }
        var result: [UserProgress] = []
        for uid in participantIds {
            let userLogs = logs.filter { $0.user_id == uid }
            let cardioTotal = userLogs.filter { $0.log_type == "cardio" }.reduce(0.0) { $0 + ($1.cardio_amount ?? 0) }
            let cardioProgress = min(cardioTotal / challenge.cardioTarget, 1.0)
            var exerciseTotals: [String: Int] = [:]
            for ex in exercises {
                let total = userLogs.filter { $0.log_type == "strength" && $0.exercise_id == ex.id }.reduce(0) { $0 + ($1.strength_reps ?? 0) }
                exerciseTotals[ex.id] = total
            }
            let strengthProgresses = exercises.map { ex in
                min(Double(exerciseTotals[ex.id] ?? 0) / Double(ex.target_reps), 1.0)
            }
            let strengthOverall = strengthProgresses.isEmpty ? 0 : strengthProgresses.reduce(0, +) / Double(strengthProgresses.count)
            let totalProgress = (cardioProgress + strengthOverall) / 2
            let lastActivity = userLogs.map(\.created_at).max()
            result.append(UserProgress(
                userId: uid,
                displayName: profileCache[uid] ?? "Unknown",
                cardioTotal: cardioTotal,
                cardioProgress: cardioProgress,
                strengthOverallProgress: strengthOverall,
                totalProgress: totalProgress,
                exerciseTotals: exerciseTotals
            ))
        }
        result.sort { $0.totalProgress > $1.totalProgress }
        return result
    }

    func getUserProgress(userId: String, challengeId: String) async throws -> UserProgress? {
        guard let challengeDto: WeekChallengeDTO = try? await client.from("week_challenges").select().eq("id", value: challengeId).single().execute().value else { return nil }
        let challenge = WeekChallenge(
            id: challengeDto.id,
            groupId: challengeDto.group_id,
            weekAssignmentId: challengeDto.week_assignment_id,
            cardioMetric: CardioMetric(rawValue: challengeDto.cardio_metric) ?? .miles,
            cardioTarget: challengeDto.cardio_target
        )
        let exResponse: PostgrestResponse<[StrengthExerciseDTO]> = try await client.from("strength_exercises").select().eq("week_challenge_id", value: challengeId).order("sort_order").execute()
        let exercises = exResponse.value
        let logs: [WorkoutLogDTO] = try await client.from("workout_logs")
            .select()
            .eq("user_id", value: userId)
            .eq("week_challenge_id", value: challengeId)
            .execute()
            .value
        let cardioTotal = logs.filter { $0.log_type == "cardio" }.reduce(0.0) { $0 + ($1.cardio_amount ?? 0) }
        let cardioProgress = min(cardioTotal / challenge.cardioTarget, 1.0)
        var exerciseTotals: [String: Int] = [:]
        for ex in exercises {
            exerciseTotals[ex.id] = logs.filter { $0.log_type == "strength" && $0.exercise_id == ex.id }.reduce(0) { $0 + ($1.strength_reps ?? 0) }
        }
        let strengthProgresses = exercises.map { ex in min(Double(exerciseTotals[ex.id] ?? 0) / Double(ex.target_reps), 1.0) }
        let strengthOverall = strengthProgresses.isEmpty ? 0 : strengthProgresses.reduce(0, +) / Double(strengthProgresses.count)
        let totalProgress = (cardioProgress + strengthOverall) / 2
        let profile = try? await getProfile(userId: userId)
        return UserProgress(
            userId: userId,
            displayName: profile?.displayName ?? "Unknown",
            cardioTotal: cardioTotal,
            cardioProgress: cardioProgress,
            strengthOverallProgress: strengthOverall,
            totalProgress: totalProgress,
            exerciseTotals: exerciseTotals
        )
    }

    // MARK: - Activity feed

    func getActivityFeed(groupId: String, limit: Int = 5) async throws -> [ActivityFeedItem] {
        let today = Self.localDateString()
        var regularLogs: [(id: String, user_id: String, log_type: String, cardio_activity: String?, cardio_amount: Double?, exercise_id: String?, strength_reps: Int?, created_at: String, is_punishment: Bool)] = []
        let assignments: [WeekAssignmentDTO] = try await client.from("week_assignments")
            .select()
            .eq("group_id", value: groupId)
            .lte("start_date", value: today)
            .gte("end_date", value: today)
            .limit(1)
            .execute()
            .value
        if let a = assignments.first {
            let challenges: [WeekChallengeDTO] = try await client.from("week_challenges").select().eq("week_assignment_id", value: a.id).limit(1).execute().value
            if let c = challenges.first {
                struct LogRow: Decodable {
                    let id: String
                    let user_id: String
                    let log_type: String
                    let cardio_activity: String?
                    let cardio_amount: Double?
                    let exercise_id: String?
                    let strength_reps: Int?
                    let created_at: String
                }
                let rows: [LogRow] = try await client.from("workout_logs")
                    .select()
                    .eq("week_challenge_id", value: c.id)
                    .order("created_at", ascending: false)
                    .limit(limit)
                    .execute()
                    .value
                for r in rows {
                    regularLogs.append((r.id, r.user_id, r.log_type, r.cardio_activity, r.cardio_amount, r.exercise_id, r.strength_reps, r.created_at, false))
                }
            }
        }
        let punishmentRows: [PunishmentDTO] = try await client.from("punishments")
            .select()
            .eq("group_id", value: groupId)
            .lte("start_date", value: today)
            .gte("end_date", value: today)
            .execute()
            .value
        var punishmentLogs: [(id: String, user_id: String, log_type: String, cardio_activity: String?, cardio_amount: Double?, exercise_id: String?, strength_reps: Int?, created_at: String, is_punishment: Bool)] = []
        if !punishmentRows.isEmpty {
            struct Plog: Decodable {
                let id: String
                let user_id: String
                let log_type: String
                let cardio_activity: String?
                let cardio_amount: Double?
                let exercise_id: String?
                let strength_reps: Int?
                let created_at: String
            }
            let pids = punishmentRows.map(\.id)
            let plogs: [Plog] = try await client.from("punishment_logs")
                .select()
                .in("punishment_id", values: pids)
                .order("created_at", ascending: false)
                .limit(limit)
                .execute()
                .value
            for p in plogs {
                punishmentLogs.append((p.id, p.user_id, p.log_type, p.cardio_activity, p.cardio_amount, p.exercise_id, p.strength_reps, p.created_at, true))
            }
        }
        var all = regularLogs.map { r in (r.0, r.1, r.2, r.3, r.4, r.5, r.6, r.7, r.8) }
        all.append(contentsOf: punishmentLogs.map { r in (r.0, r.1, r.2, r.3, r.4, r.5, r.6, r.7, r.8) })
        all.sort { $0.7 > $1.7 }
        let limited = Array(all.prefix(limit))
        var feed: [ActivityFeedItem] = []
        for item in limited {
            let profile = try? await getProfile(userId: item.1)
            var exerciseName: String?
            if let eid = item.5 {
                if item.8 {
                    let exResponse: PostgrestResponse<[PunishmentExerciseDTO]>? = try? await client.from("punishment_exercises").select().eq("id", value: eid).limit(1).execute()
                    exerciseName = exResponse?.value.first?.name
                } else {
                    let exResponse: PostgrestResponse<[StrengthExerciseDTO]>? = try? await client.from("strength_exercises").select().eq("id", value: eid).limit(1).execute()
                    exerciseName = exResponse?.value.first?.name
                }
            }
            feed.append(ActivityFeedItem(
                id: item.0,
                userId: item.1,
                displayName: profile?.displayName ?? "Unknown",
                logType: LogType(rawValue: item.2) ?? .cardio,
                cardioActivity: item.3.flatMap { CardioActivity(rawValue: $0) },
                cardioAmount: item.4,
                exerciseName: exerciseName,
                strengthReps: item.6,
                createdAt: item.7
            ))
        }
        return feed
    }

    // MARK: - Punishments

    func getAllPunishments(groupId: String) async throws -> [Punishment] {
        let list: [PunishmentDTO] = try await client.from("punishments")
            .select()
            .eq("group_id", value: groupId)
            .order("created_at", ascending: false)
            .execute()
            .value
        var result: [Punishment] = []
        for p in list {
            let assignments: [PunishmentAssignmentDTO] = try await client.from("punishment_assignments")
                .select("user_id")
                .eq("punishment_id", value: p.id)
                .execute()
                .value
            let userIds = assignments.map(\.user_id)
            result.append(Punishment(
                id: p.id,
                groupId: p.group_id,
                startDate: String(p.start_date.prefix(10)),
                endDate: String(p.end_date.prefix(10)),
                assignedUserIds: userIds,
                cardioMetric: p.cardio_metric.flatMap { CardioMetric(rawValue: $0) },
                cardioTarget: p.cardio_target,
                exerciseName: nil,
                exerciseTargetReps: nil
            ))
        }
        return result
    }

    func createPunishment(groupId: String, assignedBy: String, startDate: String, endDate: String, userIds: [String], cardioMetric: CardioMetric?, cardioTarget: Double?, exercises: [(name: String, targetReps: Int)]) async throws -> Punishment {
        var insert = PunishmentInsert(group_id: groupId, assigned_by: assignedBy, start_date: String(startDate.prefix(10)), end_date: String(endDate.prefix(10)), cardio_metric: nil, cardio_target: nil)
        insert.cardio_metric = cardioMetric?.rawValue
        insert.cardio_target = cardioTarget
        let dto: PunishmentDTO = try await client.from("punishments")
            .insert(insert)
            .select()
            .single()
            .execute()
            .value
        for uid in userIds {
            try await client.from("punishment_assignments")
                .insert(PunishmentAssignmentInsert(punishment_id: dto.id, user_id: uid))
                .execute()
        }
        for (i, e) in exercises.enumerated() {
            try await client.from("punishment_exercises")
                .insert(PunishmentExerciseInsert(punishment_id: dto.id, name: e.name, target_reps: e.targetReps, sort_order: i + 1))
                .execute()
        }
        return Punishment(
            id: dto.id,
            groupId: dto.group_id,
            startDate: String(dto.start_date.prefix(10)),
            endDate: String(dto.end_date.prefix(10)),
            assignedUserIds: userIds,
            cardioMetric: dto.cardio_metric.flatMap { CardioMetric(rawValue: $0) },
            cardioTarget: dto.cardio_target,
            exerciseName: nil,
            exerciseTargetReps: nil
        )
    }

    func deletePunishment(punishmentId: String) async throws {
        try await client.from("punishments").delete().eq("id", value: punishmentId).execute()
    }

    func updatePunishment(punishmentId: String, startDate: String, endDate: String, userIds: [String], cardioMetric: CardioMetric?, cardioTarget: Double?, exercises: [(name: String, targetReps: Int)]) async throws {
        var payload = PunishmentUpdate(start_date: String(startDate.prefix(10)), end_date: String(endDate.prefix(10)), cardio_metric: nil, cardio_target: nil)
        payload.cardio_metric = cardioMetric?.rawValue
        payload.cardio_target = cardioTarget
        try await client.from("punishments").update(payload).eq("id", value: punishmentId).execute()
        try await client.from("punishment_assignments").delete().eq("punishment_id", value: punishmentId).execute()
        for uid in userIds {
            try await client.from("punishment_assignments").insert(PunishmentAssignmentInsert(punishment_id: punishmentId, user_id: uid)).execute()
        }
        try await client.from("punishment_exercises").delete().eq("punishment_id", value: punishmentId).execute()
        for (i, e) in exercises.enumerated() {
            try await client.from("punishment_exercises")
                .insert(PunishmentExerciseInsert(punishment_id: punishmentId, name: e.name, target_reps: e.targetReps, sort_order: i + 1))
                .execute()
        }
    }
}
