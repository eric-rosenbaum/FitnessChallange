//
//  SettingsView.swift
//  FitnessChallenge
//
//  Group settings: name, members (remove, participant/spectator), punishments.
//

import SwiftUI

struct SettingsView: View {
    @Bindable var appState: AppState
    @State private var isSavingName = false
    @State private var memberTypeEditTarget: MemberTypeEditTarget?
    @State private var selectedMemberType: MemberType = .participant
    @State private var showRemoveMemberAlert = false
    @State private var memberToRemove: String?
    @State private var showPunishmentForm = false
    @State private var punishmentStartDate = Date()
    @State private var punishmentEndDate = Date()
    @State private var punishmentUserIds: Set<String> = []
    @State private var punishmentCardioMetric: CardioMetric?
    @State private var punishmentCardioTarget: String = ""
    @State private var punishmentExerciseName: String = ""
    @State private var punishmentExerciseReps: String = ""

    @State private var editingCurrentDates = false
    @State private var currentWeekStartDate = Date()
    @State private var currentWeekEndDate = Date()
    @State private var editingCurrentHost = false
    @State private var currentWeekHostId: String = ""
    @State private var editingChallenge = false
    @State private var challengeCardioTarget: String = ""
    @State private var challengeCardioMetric: CardioMetric = .miles
    @State private var newExerciseName: String = ""
    @State private var newExerciseReps: String = ""
    @State private var showAddUpcoming = false
    @State private var upcomingFormHostId: String = ""
    @State private var upcomingFormStartDate = Date()
    @State private var upcomingFormEndDate = Date()
    @State private var editingUpcomingId: String?
    @State private var editUpcomingHostId: String = ""
    @State private var editUpcomingStartDate = Date()
    @State private var editUpcomingEndDate = Date()
    @State private var editUpcomingChallengeAssignment: WeekAssignment?

    @State private var showCreateWeekForm = false
    @State private var newWeekStartDate = Date()
    @State private var newWeekEndDate = Date()
    @State private var newWeekHostId: String = ""
    @State private var showCreateChallengeForm = false
    @State private var newChallengeCardioMetric: CardioMetric = .miles
    @State private var newChallengeCardioTarget: String = ""
    @State private var newChallengeExercises: [(name: String, reps: Int)] = []
    @State private var newChallengeExerciseName: String = ""
    @State private var newChallengeExerciseReps: String = ""

    private static let dateFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        return f
    }()

    private var isAdmin: Bool { appState.isAdmin }
    private var isCurrentWeekHost: Bool {
        appState.activeWeek.weekAssignment.hostUserId.lowercased() == appState.currentUserId.lowercased()
    }

    var body: some View {
        List {
            groupNameSection
            membersSection
            currentWeekSection
            upcomingAssignmentsSection
            if isAdmin {
                punishmentsSection
            }
        }
        .navigationTitle("Group")
        .sheet(item: $editUpcomingChallengeAssignment) { assignment in
            CreateChallengeSheet(appState: appState, assignment: assignment)
        }
        .alert("Remove member?", isPresented: $showRemoveMemberAlert) {
            Button("Cancel", role: .cancel) { memberToRemove = nil }
            Button(memberToRemove == appState.currentUserId ? "Leave" : "Remove", role: .destructive) {
                if let id = memberToRemove {
                    appState.removeMember(userId: id)
                }
                memberToRemove = nil
            }
        } message: {
            Text(memberToRemove == appState.currentUserId
                 ? "Are you sure you want to leave this group?"
                 : "Are you sure you want to remove this member?")
        }
    }

    @State private var isEditingGroupName = false
    @State private var editingGroupNameValue: String = ""

    private var groupNameSection: some View {
        Section("Group") {
            if isEditingGroupName {
                HStack {
                    TextField("Name", text: $editingGroupNameValue)
                    Button("Save") {
                        let trimmed = editingGroupNameValue.trimmingCharacters(in: .whitespacesAndNewlines)
                        if !trimmed.isEmpty {
                            appState.updateGroupName(trimmed)
                        }
                        isEditingGroupName = false
                    }
                    .font(.subheadline.weight(.medium))
                    .foregroundStyle(Theme.brown)
                    Button("Cancel") {
                        editingGroupNameValue = appState.groupName
                        isEditingGroupName = false
                    }
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                }
            } else {
                HStack {
                    Text(appState.groupName)
                        .foregroundStyle(.primary)
                    Spacer()
                    Button {
                        editingGroupNameValue = appState.groupName
                        isEditingGroupName = true
                    } label: {
                        Image(systemName: "pencil.circle.fill")
                            .font(.title2)
                            .foregroundStyle(Theme.brown)
                    }
                }
            }
            HStack {
                Text("Invite code")
                Spacer()
                Text(appState.groupInviteCode)
                    .foregroundStyle(.secondary)
            }
        }
    }

    private var membersSection: some View {
        Section("Members") {
            ForEach(appState.memberships) { m in
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(appState.displayName(for: m.userId))
                        if m.userId.lowercased() == appState.currentUserId.lowercased() {
                            Text("(You)")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                    Spacer()
                    HStack(spacing: 8) {
                        Text(m.memberType.rawValue.capitalized)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        Text(m.role.rawValue.capitalized)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        if isAdmin && m.userId.lowercased() != appState.currentUserId.lowercased() {
                            Button {
                                selectedMemberType = m.memberType
                                memberTypeEditTarget = MemberTypeEditTarget(id: m.userId)
                            } label: {
                                Image(systemName: "person.2.fill")
                                    .font(.caption)
                                    .foregroundStyle(Theme.brown)
                            }
                        }
                    }
                }
                .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                    if appState.memberships.count > 1 {
                        Button(role: .destructive) {
                            memberToRemove = m.userId
                            showRemoveMemberAlert = true
                        } label: {
                            Label(m.userId.lowercased() == appState.currentUserId.lowercased() ? "Leave" : "Remove", systemImage: "trash")
                        }
                    }
                }
            }
            Text("Share the invite code so others can join.")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .sheet(item: $memberTypeEditTarget) { target in
            memberTypeSheet(userId: target.userId)
        }
    }

    private struct MemberTypeEditTarget: Identifiable {
        let id: String
        var userId: String { id }
    }

    private var currentWeekSection: some View {
        Section("Current Week Assignment") {
            if !appState.hasCurrentWeekAssignment {
                if isAdmin {
                    Text("No current week. Create one so the group can log workouts.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    if showCreateWeekForm {
                        DatePicker("Start", selection: $newWeekStartDate, displayedComponents: .date)
                        DatePicker("End", selection: $newWeekEndDate, displayedComponents: .date)
                        Picker("Host", selection: $newWeekHostId) {
                            ForEach(appState.memberships) { m in
                                Text(appState.displayName(for: m.userId)).tag(m.userId)
                            }
                        }
                        HStack {
                            Button("Cancel") { showCreateWeekForm = false }
                            Spacer()
                            Button("Create week") {
                                guard !newWeekHostId.isEmpty else { return }
                                appState.addUpcomingAssignment(hostUserId: newWeekHostId, startDate: Self.dateFormatter.string(from: newWeekStartDate), endDate: Self.dateFormatter.string(from: newWeekEndDate))
                                showCreateWeekForm = false
                            }
                            .foregroundStyle(Theme.brown)
                        }
                    } else {
                        Button {
                            newWeekHostId = appState.memberships.first?.userId ?? ""
                            let cal = Calendar.current
                            newWeekStartDate = Date()
                            newWeekEndDate = cal.date(byAdding: .day, value: 6, to: Date()) ?? Date()
                            showCreateWeekForm = true
                        } label: {
                            Label("Create current week", systemImage: "plus.circle.fill")
                                .foregroundStyle(Theme.brown)
                        }
                    }
                } else {
                    Text("No current week. Ask an admin to create one.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            } else if appState.challenge == nil {
                HStack {
                    Text("Host")
                    Spacer()
                    Text(appState.activeWeek.hostName)
                        .foregroundStyle(.secondary)
                }
                .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                    if isAdmin {
                        Button(role: .destructive) {
                            appState.deleteCurrentWeekAssignment()
                        } label: { Label("Delete", systemImage: "trash") }
                    }
                }
                HStack {
                    Text("Dates")
                    Spacer()
                    Text("\(appState.activeWeek.weekAssignment.startDate) – \(appState.activeWeek.weekAssignment.endDate)")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                if isAdmin || isCurrentWeekHost {
                    Text("Create a challenge so members can log cardio and strength.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    if showCreateChallengeForm {
                        Picker("Cardio metric", selection: $newChallengeCardioMetric) {
                            ForEach(CardioMetric.allCases, id: \.self) { Text($0.displayName).tag($0) }
                        }
                        TextField("Cardio target", text: $newChallengeCardioTarget)
                            .keyboardType(.decimalPad)
                        Text("Exercises")
                            .font(.subheadline.weight(.medium))
                        ForEach(Array(newChallengeExercises.enumerated()), id: \.offset) { item in
                            HStack {
                                Text(item.element.name)
                                Spacer()
                                Text("\(item.element.reps) reps")
                                    .foregroundStyle(.secondary)
                            }
                        }
                        HStack {
                            TextField("Name", text: $newChallengeExerciseName)
                            TextField("Reps", text: $newChallengeExerciseReps)
                                .keyboardType(.numberPad)
                            Button("Add") {
                                guard let reps = Int(newChallengeExerciseReps), !newChallengeExerciseName.isEmpty else { return }
                                newChallengeExercises.append((name: newChallengeExerciseName, reps: reps))
                                newChallengeExerciseName = ""
                                newChallengeExerciseReps = ""
                            }
                            .foregroundStyle(Theme.brown)
                        }
                        HStack {
                            Button("Cancel") {
                                showCreateChallengeForm = false
                            }
                            Spacer()
                            Button("Create challenge") {
                                guard let target = Double(newChallengeCardioTarget), !newChallengeExercises.isEmpty else { return }
                                let exercises = newChallengeExercises.map { (name: $0.name, targetReps: $0.reps) }
                                appState.createChallenge(cardioMetric: newChallengeCardioMetric, cardioTarget: target, exercises: exercises)
                                showCreateChallengeForm = false
                                newChallengeExercises = []
                                newChallengeCardioTarget = ""
                            }
                            .disabled(newChallengeCardioTarget.isEmpty || newChallengeExercises.isEmpty)
                            .foregroundStyle(Theme.brown)
                        }
                    } else {
                        Button {
                            showCreateChallengeForm = true
                        } label: {
                            Label("Create challenge", systemImage: "plus.circle.fill")
                                .foregroundStyle(Theme.brown)
                        }
                    }
                } else if !isCurrentWeekHost {
                    Text("Waiting for host to create challenge.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            } else {
                if !editingCurrentDates && !editingCurrentHost && !editingChallenge {
                    HStack {
                        Text("Host")
                        Spacer()
                        Text(appState.activeWeek.hostName)
                            .foregroundStyle(.secondary)
                    }
                    .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                        if isAdmin {
                            Button(role: .destructive) {
                                appState.deleteCurrentWeekAssignment()
                            } label: { Label("Delete", systemImage: "trash") }
                        }
                    }
                    HStack {
                        Text("Dates")
                        Spacer()
                        Text("\(appState.activeWeek.weekAssignment.startDate) – \(appState.activeWeek.weekAssignment.endDate)")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    if let ch = appState.activeWeek.challenge {
                        HStack {
                            Text("Cardio")
                            Spacer()
                            Text("\(Int(ch.cardioTarget)) \(ch.cardioMetric.displayName)")
                                .foregroundStyle(.secondary)
                        }
                        ForEach(appState.exercises) { ex in
                            HStack {
                                Text(ex.name)
                                Spacer()
                                Text("\(ex.targetReps) reps")
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                    if isAdmin || isCurrentWeekHost {
                        HStack(spacing: 16) {
                            if isAdmin {
                            Button("Edit dates") {
                                currentWeekStartDate = Self.dateFormatter.date(from: appState.activeWeek.weekAssignment.startDate) ?? Date()
                                currentWeekEndDate = Self.dateFormatter.date(from: appState.activeWeek.weekAssignment.endDate) ?? Date()
                                editingCurrentDates = true
                            }
                            .font(.subheadline)
                            .foregroundStyle(Theme.brown)
                            Button("Change host") {
                                currentWeekHostId = appState.activeWeek.weekAssignment.hostUserId
                                editingCurrentHost = true
                            }
                            .font(.subheadline)
                            .foregroundStyle(Theme.brown)
                            }
                            Button("Edit exercises") {
                                if let ch = appState.challenge {
                                    challengeCardioTarget = String(Int(ch.cardioTarget))
                                    challengeCardioMetric = ch.cardioMetric
                                    editingChallenge = true
                                }
                            }
                            .font(.subheadline)
                            .foregroundStyle(Theme.brown)
                        }
                    }
                }
                if editingCurrentDates && isAdmin {
                    DatePicker("Start", selection: $currentWeekStartDate, displayedComponents: .date)
                    DatePicker("End", selection: $currentWeekEndDate, displayedComponents: .date)
                    HStack {
                        Button("Cancel") { editingCurrentDates = false }
                        Spacer()
                        Button("Save") {
                            appState.updateCurrentWeekDates(start: Self.dateFormatter.string(from: currentWeekStartDate), end: Self.dateFormatter.string(from: currentWeekEndDate))
                            editingCurrentDates = false
                        }
                        .foregroundStyle(Theme.brown)
                    }
                }
                if editingCurrentHost && isAdmin {
                    Picker("Host", selection: $currentWeekHostId) {
                        ForEach(appState.memberships) { m in
                            Text(appState.displayName(for: m.userId)).tag(m.userId)
                        }
                    }
                    HStack {
                        Button("Cancel") { editingCurrentHost = false }
                        Spacer()
                        Button("Save") {
                            appState.updateCurrentWeekHost(userId: currentWeekHostId)
                            editingCurrentHost = false
                        }
                        .foregroundStyle(Theme.brown)
                    }
                }
                if editingChallenge && (isAdmin || isCurrentWeekHost) {
                    Picker("Cardio metric", selection: $challengeCardioMetric) {
                        ForEach(CardioMetric.allCases, id: \.self) { Text($0.displayName).tag($0) }
                    }
                    TextField("Cardio target", text: $challengeCardioTarget)
                        .keyboardType(.decimalPad)
                    Text("Exercises")
                        .font(.subheadline.weight(.medium))
                    ForEach(appState.exercises) { ex in
                        HStack {
                            Text(ex.name)
                            Spacer()
                            Text("\(ex.targetReps)")
                                .foregroundStyle(.secondary)
                        }
                        .swipeActions(edge: .trailing) {
                            Button(role: .destructive) {
                                appState.removeExercise(id: ex.id)
                            } label: { Label("Delete", systemImage: "trash") }
                        }
                    }
                    HStack {
                        TextField("Name", text: $newExerciseName)
                        TextField("Reps", text: $newExerciseReps)
                            .keyboardType(.numberPad)
                        Button("Add") {
                            guard let reps = Int(newExerciseReps), !newExerciseName.isEmpty else { return }
                            appState.addExercise(name: newExerciseName, targetReps: reps)
                            newExerciseName = ""
                            newExerciseReps = ""
                        }
                        .foregroundStyle(Theme.brown)
                    }
                    HStack {
                        Button("Cancel") { editingChallenge = false }
                        Spacer()
                        Button("Save") {
                            if let t = Double(challengeCardioTarget) {
                                appState.updateChallenge(cardioMetric: challengeCardioMetric, cardioTarget: t)
                            }
                            editingChallenge = false
                        }
                        .foregroundStyle(Theme.brown)
                    }
                }
            }
        }
    }

    private var upcomingAssignmentsSection: some View {
        Section("Upcoming Assignments") {
            ForEach(appState.upcomingAssignments) { a in
                if editingUpcomingId == a.id {
                    DatePicker("Start", selection: $editUpcomingStartDate, displayedComponents: .date)
                    DatePicker("End", selection: $editUpcomingEndDate, displayedComponents: .date)
                    Picker("Host", selection: $editUpcomingHostId) {
                        ForEach(appState.memberships) { m in
                            Text(appState.displayName(for: m.userId)).tag(m.userId)
                        }
                    }
                    HStack {
                        Button("Cancel") { editingUpcomingId = nil }
                        Spacer()
                        Button("Save") {
                            appState.updateUpcomingAssignment(id: a.id, hostUserId: editUpcomingHostId, startDate: Self.dateFormatter.string(from: editUpcomingStartDate), endDate: Self.dateFormatter.string(from: editUpcomingEndDate))
                            editingUpcomingId = nil
                        }
                        .foregroundStyle(Theme.brown)
                    }
                } else {
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(appState.displayName(for: a.hostUserId))
                            Text("\(a.startDate) – \(a.endDate)")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                        HStack(spacing: 8) {
                            if a.hostUserId.lowercased() == appState.currentUserId.lowercased() {
                                Button("Set Exercises") {
                                    editUpcomingChallengeAssignment = a
                                }
                                .font(.caption)
                                .foregroundStyle(Theme.brown)
                            }
                            if isAdmin {
                                Button("Edit") {
                                    editUpcomingHostId = a.hostUserId
                                    editUpcomingStartDate = Self.dateFormatter.date(from: a.startDate) ?? Date()
                                    editUpcomingEndDate = Self.dateFormatter.date(from: a.endDate) ?? Date()
                                    editingUpcomingId = a.id
                                }
                                .font(.caption)
                                .foregroundStyle(Theme.brown)
                            }
                        }
                    }
                    .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                        if isAdmin {
                            Button(role: .destructive) {
                                appState.removeUpcomingAssignment(id: a.id)
                            } label: { Label("Delete", systemImage: "trash") }
                        }
                    }
                }
            }
            if isAdmin {
                if showAddUpcoming {
                    DatePicker("Start", selection: $upcomingFormStartDate, displayedComponents: .date)
                    DatePicker("End", selection: $upcomingFormEndDate, displayedComponents: .date)
                    Picker("Host", selection: $upcomingFormHostId) {
                        ForEach(appState.memberships) { m in
                            Text(appState.displayName(for: m.userId)).tag(m.userId)
                        }
                    }
                    HStack {
                        Button("Cancel") {
                            showAddUpcoming = false
                        }
                        Spacer()
                        Button("Add") {
                            guard !upcomingFormHostId.isEmpty else { return }
                            appState.addUpcomingAssignment(hostUserId: upcomingFormHostId, startDate: Self.dateFormatter.string(from: upcomingFormStartDate), endDate: Self.dateFormatter.string(from: upcomingFormEndDate))
                            let cal = Calendar.current
                            upcomingFormStartDate = cal.date(byAdding: .day, value: 7, to: upcomingFormStartDate) ?? upcomingFormStartDate
                            upcomingFormEndDate = cal.date(byAdding: .day, value: 6, to: upcomingFormStartDate) ?? upcomingFormEndDate
                            upcomingFormHostId = appState.memberships.first?.userId ?? ""
                            showAddUpcoming = false
                        }
                        .foregroundStyle(Theme.brown)
                    }
                } else {
                    Button {
                        let cal = Calendar.current
                        let end = Self.dateFormatter.date(from: appState.activeWeek.weekAssignment.endDate) ?? Date()
                        upcomingFormStartDate = cal.date(byAdding: .day, value: 1, to: end) ?? Date()
                        upcomingFormEndDate = cal.date(byAdding: .day, value: 6, to: upcomingFormStartDate) ?? upcomingFormStartDate
                        upcomingFormHostId = appState.memberships.first?.userId ?? ""
                        showAddUpcoming = true
                    } label: {
                        Label("Add upcoming assignment", systemImage: "plus.circle")
                    }
                }
            }
        }
    }

    private var punishmentsSection: some View {
        Section("Punishments") {
            ForEach(appState.punishments) { p in
                VStack(alignment: .leading, spacing: 4) {
                    Text("\(p.startDate) – \(p.endDate)")
                        .font(.subheadline.weight(.medium))
                    if !p.assignedUserIds.isEmpty {
                        let names = p.assignedUserIds.map { appState.displayName(for: $0) }
                        Text("Assigned: \(names.joined(separator: ", "))")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    if let metric = p.cardioMetric, let target = p.cardioTarget {
                        Text("Cardio: \(String(format: "%.1f", target)) \(metric.displayName)")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                    if let name = p.exerciseName, let reps = p.exerciseTargetReps {
                        Text("\(name): \(reps) reps")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
                .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                    Button(role: .destructive) {
                        appState.deletePunishment(id: p.id)
                    } label: {
                        Label("Delete", systemImage: "trash")
                    }
                }
            }
            if !showPunishmentForm {
                Button {
                    setPunishmentFormDefaults()
                    showPunishmentForm = true
                } label: {
                    Label("Assign Punishment", systemImage: "plus.circle.fill")
                }
            } else {
                punishmentForm
            }
        }
    }

    private func memberTypeSheet(userId: String) -> some View {
        NavigationStack {
            Form {
                Picker("Member type", selection: $selectedMemberType) {
                    Text("Participant").tag(MemberType.participant)
                    Text("Spectator").tag(MemberType.spectator)
                }
                .pickerStyle(.inline)
            }
            .navigationTitle("Member type")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { memberTypeEditTarget = nil }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Update") {
                        appState.updateMemberType(userId: userId, memberType: selectedMemberType)
                        memberTypeEditTarget = nil
                    }
                }
            }
        }
        .presentationDetents([.medium])
        .onAppear {
            if let m = appState.memberships.first(where: { $0.userId == userId }) {
                selectedMemberType = m.memberType
            }
        }
    }

    private func setPunishmentFormDefaults() {
        let cal = Calendar.current
        let today = Date()
        punishmentStartDate = today
        punishmentEndDate = cal.date(byAdding: .day, value: 6, to: today) ?? today
        punishmentUserIds = []
        punishmentCardioMetric = nil
        punishmentCardioTarget = ""
        punishmentExerciseName = ""
        punishmentExerciseReps = ""
    }

    private var punishmentForm: some View {
        SwiftUI.Group {
            Label("New punishment", systemImage: "minus.circle")
                .font(.subheadline.weight(.semibold))
            DatePicker("Start", selection: $punishmentStartDate, displayedComponents: .date)
            DatePicker("End", selection: $punishmentEndDate, displayedComponents: .date)
            Text("Assign to (participants)")
                .font(.caption)
            ForEach(appState.memberships.filter { $0.memberType == .participant }) { m in
                Toggle(appState.displayName(for: m.userId), isOn: Binding(
                    get: { punishmentUserIds.contains(m.userId) },
                    set: { if $0 { punishmentUserIds.insert(m.userId) } else { punishmentUserIds.remove(m.userId) } }
                ))
            }
            Picker("Cardio (optional)", selection: $punishmentCardioMetric) {
                Text("None").tag(nil as CardioMetric?)
                ForEach(CardioMetric.allCases, id: \.self) { m in
                    Text(m.displayName).tag(m as CardioMetric?)
                }
            }
            if punishmentCardioMetric != nil {
                TextField("Target", text: $punishmentCardioTarget)
                    .keyboardType(.decimalPad)
            }
            HStack {
                TextField("Exercise name", text: $punishmentExerciseName)
                TextField("Reps", text: $punishmentExerciseReps)
                    .keyboardType(.numberPad)
            }
            HStack {
                Button("Cancel") {
                    showPunishmentForm = false
                }
                Spacer()
                Button("Create") {
                    createPunishment()
                    showPunishmentForm = false
                }
                .disabled(!canCreatePunishment)
                .fontWeight(.medium)
                .foregroundStyle(Theme.brown)
            }
        }
    }

    private var canCreatePunishment: Bool {
        !punishmentUserIds.isEmpty &&
        ((punishmentCardioMetric != nil && Double(punishmentCardioTarget) != nil) ||
         (!punishmentExerciseName.isEmpty && Int(punishmentExerciseReps) != nil))
    }

    private func createPunishment() {
        let cardioTarget: Double? = punishmentCardioMetric != nil ? Double(punishmentCardioTarget) : nil
        let exReps = Int(punishmentExerciseReps)
        let p = Punishment(
            id: "pun-\(UUID().uuidString)",
            groupId: appState.group.id,
            startDate: Self.dateFormatter.string(from: punishmentStartDate),
            endDate: Self.dateFormatter.string(from: punishmentEndDate),
            assignedUserIds: Array(punishmentUserIds),
            cardioMetric: punishmentCardioMetric,
            cardioTarget: cardioTarget,
            exerciseName: punishmentExerciseName.isEmpty ? nil : punishmentExerciseName,
            exerciseTargetReps: exReps
        )
        appState.addPunishment(p)
    }
}

