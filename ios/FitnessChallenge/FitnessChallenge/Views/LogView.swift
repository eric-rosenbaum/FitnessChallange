//
//  LogView.swift
//  FitnessChallenge
//
//  Log workout (cardio or strength) – dummy: appends to DummyData.logs.
//

import SwiftUI

private enum LogFocus: Hashable {
    case cardioAmount
    case strengthReps
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

    private var challenge: WeekChallenge? { appState.challenge }
    private var exercises: [StrengthExercise] { appState.exercises }

    var body: some View {
        SwiftUI.Group {
            if let challenge {
                logForm(challenge: challenge)
            } else {
                ContentUnavailableView("No active challenge", systemImage: "dumbbell", description: Text("The host needs to set up this week's challenge before you can log workouts."))
            }
        }
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
                    Button(action: saveLog, label: { Text("Save") })
                        .disabled(!canSave)
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
        }
        .simultaneousGesture(TapGesture().onEnded { _ in
            focusedField = nil
        })
    }

    private func logForm(challenge: WeekChallenge) -> some View {
        Form {
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
                    TextField("Reps", text: $strengthReps)
                        .keyboardType(.numberPad)
                        .focused($focusedField, equals: .strengthReps)
                }

                DatePicker("Date", selection: $loggedDate, displayedComponents: .date)
        }
        .scrollDismissesKeyboard(.interactively)
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
        guard let challenge, canSave else { return }
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
        appState.addLog(log) { [sheetIsPresented, onSaveSwitchToHome] in
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
