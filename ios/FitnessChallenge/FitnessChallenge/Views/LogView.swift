//
//  LogView.swift
//  FitnessChallenge
//
//  Log workout (cardio or strength) – persists via Supabase.
//

import SwiftUI

private enum LogFocus: Hashable {
    case cardioAmount
    case strengthReps
    case punishmentCardioAmount
    case punishmentStrengthReps
}

struct LogView: View {
    @Bindable var appState: AppState
    @Environment(\.dismiss) private var dismiss
    /// When provided (e.g. from sheet), set to false to dismiss the sheet.
    var sheetIsPresented: Binding<Bool>?
    /// When provided (e.g. from MainTabView), called after save so parent can switch to Home tab.
    var onSaveSwitchToHome: (() -> Void)?

    @FocusState private var focusedField: LogFocus?
    @State private var tab: LogType = .cardio
    @State private var cardioActivity: CardioActivity = .run
    @State private var cardioAmount: String = ""
    @State private var selectedExerciseId: String = ""
    @State private var strengthReps: String = ""
    @State private var loggedDate: Date = Date()
    @State private var isSaving: Bool = false

    @State private var punishmentTab: LogType = .cardio
    @State private var punishmentCardioActivity: CardioActivity = .run
    @State private var punishmentCardioAmount: String = ""
    @State private var punishmentSelectedExerciseId: String = ""
    @State private var punishmentStrengthReps: String = ""
    @State private var punishmentLoggedDate: Date = Date()
    @State private var isSavingPunishment: Bool = false

    private var challenge: WeekChallenge? { appState.challenge }
    private var exercises: [StrengthExercise] { appState.exercises }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Log Workout")
                        .font(.headline)
                        .foregroundStyle(.primary)
                    if let challenge {
                        logForm(challenge: challenge)
                    } else {
                        ContentUnavailableView("No active challenge", systemImage: "dumbbell", description: Text("The host needs to set up this week's challenge before you can log workouts."))
                    }
                }
                if let ap = appState.activePunishment {
                    punishmentLogCard(ap)
                }
            }
            .padding()
        }
        .scrollDismissesKeyboard(.interactively)
        .navigationTitle("Log Workout")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            if sheetIsPresented != nil {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismissKeyboard()
                        sheetIsPresented?.wrappedValue = false
                    }
                }
            }
            if challenge != nil {
                ToolbarItem(placement: .confirmationAction) {
                    Button(action: saveLog, label: {
                        if isSaving {
                            ProgressView()
                                .scaleEffect(0.9)
                        } else {
                            Text("Save")
                        }
                    })
                    .disabled(!canSave || isSaving)
                    .fontWeight(.semibold)
                }
            }
            ToolbarItemGroup(placement: .keyboard) {
                Spacer()
                Button("Done") {
                    focusedField = nil
                }
                .fontWeight(.semibold)
                .foregroundStyle(Theme.brown)
            }
        }
        .onAppear {
            if selectedExerciseId.isEmpty, let first = exercises.first {
                selectedExerciseId = first.id
            }
            if let ap = appState.activePunishment, punishmentSelectedExerciseId.isEmpty, let first = ap.exercises.first {
                punishmentSelectedExerciseId = first.id
            }
        }
    }

    private func punishmentLogCard(_ ap: ActivePunishment) -> some View {
        let hasCardio = ap.punishment.cardioTarget != nil && ap.punishment.cardioMetric != nil
        let hasStrength = !ap.exercises.isEmpty
        return VStack(alignment: .leading, spacing: 12) {
            Text("Log Punishment Workout")
                .font(.headline)
                .foregroundStyle(.primary)
            if hasCardio && hasStrength {
                Picker("Type", selection: $punishmentTab) {
                    Text("Cardio").tag(LogType.cardio)
                    Text("Strength").tag(LogType.strength)
                }
                .pickerStyle(.segmented)
            }
            if punishmentTab == .cardio && hasCardio {
                Picker("Activity", selection: $punishmentCardioActivity) {
                    ForEach(CardioActivity.allCases, id: \.self) { a in
                        Text(a.displayName).tag(a)
                    }
                }
                .pickerStyle(.menu)
                TextField((ap.punishment.cardioMetric ?? .miles).displayName, text: $punishmentCardioAmount)
                    .keyboardType(.decimalPad)
                    .focused($focusedField, equals: .punishmentCardioAmount)
            } else if (punishmentTab == .strength || !hasCardio) && hasStrength {
                Picker("Exercise", selection: $punishmentSelectedExerciseId) {
                    Text("Select").tag("")
                    ForEach(ap.exercises) { ex in
                        Text(ex.name).tag(ex.id)
                    }
                }
                .pickerStyle(.menu)
                TextField("Reps", text: $punishmentStrengthReps)
                    .keyboardType(.numberPad)
                    .focused($focusedField, equals: .punishmentStrengthReps)
            }
            DatePicker("Date", selection: $punishmentLoggedDate, displayedComponents: .date)
            Button {
                savePunishmentLog(ap)
            } label: {
                if isSavingPunishment {
                    ProgressView()
                        .scaleEffect(0.9)
                        .frame(maxWidth: .infinity)
                } else {
                    Text("Save")
                        .frame(maxWidth: .infinity)
                }
            }
            .disabled(!canSavePunishment(ap) || isSavingPunishment)
            .fontWeight(.semibold)
            .foregroundStyle(.white)
            .padding(.vertical, 10)
            .background(Theme.brown)
            .clipShape(RoundedRectangle(cornerRadius: 10))
        }
        .padding()
        .background(Theme.redPunishmentCard.opacity(0.4))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(Theme.redPunishmentCard.opacity(0.5), lineWidth: 1))
    }

    private func canSavePunishment(_ ap: ActivePunishment) -> Bool {
        let hasCardio = ap.punishment.cardioTarget != nil && ap.punishment.cardioMetric != nil
        let hasStrength = !ap.exercises.isEmpty
        if punishmentTab == .cardio && hasCardio {
            return Double(punishmentCardioAmount) != nil
        }
        if (punishmentTab == .strength || !hasCardio) && hasStrength {
            return !punishmentSelectedExerciseId.isEmpty && Int(punishmentStrengthReps) != nil
        }
        return false
    }

    private func savePunishmentLog(_ ap: ActivePunishment) {
        guard canSavePunishment(ap), !isSavingPunishment else { return }
        isSavingPunishment = true
        dismissKeyboard()
        let generator = UIImpactFeedbackGenerator(style: .medium)
        generator.impactOccurred()

        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let dateStr = formatter.string(from: punishmentLoggedDate)

        let logType: LogType
        let cardioActivity: CardioActivity?
        let cardioAmount: Double?
        let exerciseId: String?
        let strengthReps: Int?

        let hasCardio = ap.punishment.cardioTarget != nil && ap.punishment.cardioMetric != nil
        let hasStrength = !ap.exercises.isEmpty
        if punishmentTab == .cardio && hasCardio {
            logType = .cardio
            cardioActivity = punishmentCardioActivity
            cardioAmount = Double(punishmentCardioAmount) ?? 0
            exerciseId = nil
            strengthReps = nil
        } else {
            logType = .strength
            cardioActivity = nil
            cardioAmount = nil
            exerciseId = punishmentSelectedExerciseId
            strengthReps = Int(punishmentStrengthReps) ?? 0
        }

        appState.addPunishmentLog(
            punishmentId: ap.punishment.id,
            loggedAt: dateStr,
            logType: logType,
            cardioActivity: cardioActivity,
            cardioAmount: cardioAmount,
            exerciseId: exerciseId,
            strengthReps: strengthReps
        ) { success in
            isSavingPunishment = false
            guard success else { return }
            clearPunishmentForm(ap)
            onSaveSwitchToHome?()
        }
    }

    private func clearPunishmentForm(_ ap: ActivePunishment) {
        punishmentCardioAmount = ""
        punishmentStrengthReps = ""
        if let first = ap.exercises.first {
            punishmentSelectedExerciseId = first.id
        } else {
            punishmentSelectedExerciseId = ""
        }
    }

    private func logForm(challenge: WeekChallenge) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Picker("Type", selection: $tab) {
                Text("Cardio").tag(LogType.cardio)
                Text("Strength").tag(LogType.strength)
            }
            .pickerStyle(.segmented)

            if tab == .cardio {
                Picker("Activity", selection: $cardioActivity) {
                    ForEach(CardioActivity.allCases, id: \.self) { a in
                        Text(a.displayName).tag(a)
                    }
                }
                .pickerStyle(.menu)
                TextField(challenge.cardioMetric.displayName, text: $cardioAmount)
                    .keyboardType(.decimalPad)
                    .focused($focusedField, equals: .cardioAmount)
            } else {
                Picker("Exercise", selection: $selectedExerciseId) {
                    Text("Select").tag("")
                    ForEach(exercises) { ex in
                        Text(ex.name).tag(ex.id)
                    }
                }
                .pickerStyle(.menu)
                TextField("Reps", text: $strengthReps)
                    .keyboardType(.numberPad)
                    .focused($focusedField, equals: .strengthReps)
            }

            DatePicker("Date", selection: $loggedDate, displayedComponents: .date)
        }
        .padding()
        .background(Theme.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(Theme.brown.opacity(0.08), lineWidth: 1))
    }

    private func dismissKeyboard() {
        focusedField = nil
    }

    private var canSave: Bool {
        switch tab {
        case .cardio:
            return Double(cardioAmount) != nil
        case .strength:
            return !selectedExerciseId.isEmpty && Int(strengthReps) != nil
        }
    }

    private func saveLog() {
        guard let challenge, canSave, !isSaving else { return }
        isSaving = true
        dismissKeyboard()
        let generator = UIImpactFeedbackGenerator(style: .medium)
        generator.impactOccurred()

        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let dateStr = formatter.string(from: loggedDate)

        let log: WorkoutLog
        switch tab {
        case .cardio:
            let amount = Double(cardioAmount) ?? 0
            log = WorkoutLog(
                id: "log-\(UUID().uuidString)",
                groupId: appState.group.id,
                weekChallengeId: challenge.id,
                userId: appState.currentUserId,
                loggedAt: dateStr,
                logType: .cardio,
                cardioActivity: cardioActivity,
                cardioAmount: amount
            )
        case .strength:
            let reps = Int(strengthReps) ?? 0
            log = WorkoutLog(
                id: "log-\(UUID().uuidString)",
                groupId: appState.group.id,
                weekChallengeId: challenge.id,
                userId: appState.currentUserId,
                loggedAt: dateStr,
                logType: .strength,
                exerciseId: selectedExerciseId,
                strengthReps: reps
            )
        }
        appState.addLog(log) { [sheetIsPresented, onSaveSwitchToHome] success in
            isSaving = false
            guard success else { return }
            if let sheetIsPresented {
                sheetIsPresented.wrappedValue = false
            } else {
                clearForm()
                onSaveSwitchToHome?()
            }
        }
    }

    private func clearForm() {
        cardioAmount = ""
        strengthReps = ""
        if let first = appState.exercises.first {
            selectedExerciseId = first.id
        } else {
            selectedExerciseId = ""
        }
    }
}
