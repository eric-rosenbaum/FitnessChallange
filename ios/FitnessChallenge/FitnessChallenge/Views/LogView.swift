//
//  LogView.swift
//  FitnessChallenge
//
//  Log workout (cardio or strength) – dummy: appends to DummyData.logs.
//

import SwiftUI

struct LogView: View {
    @Bindable var appState: AppState
    @Environment(\.dismiss) private var dismiss
    /// When provided (e.g. from sheet), set to false to dismiss the sheet.
    var sheetIsPresented: Binding<Bool>?

    @State private var tab: LogType = .cardio
    @State private var cardioActivity: CardioActivity = .run
    @State private var cardioAmount: String = ""
    @State private var selectedExerciseId: String = ""
    @State private var strengthReps: String = ""
    @State private var loggedDate: Date = Date()

    private var challenge: WeekChallenge { appState.challenge }
    private var exercises: [StrengthExercise] { appState.exercises }

    var body: some View {
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
                } else {
                    Picker("Exercise", selection: $selectedExerciseId) {
                        Text("Select").tag("")
                        ForEach(exercises) { ex in
                            Text(ex.name).tag(ex.id)
                        }
                    }
                    TextField("Reps", text: $strengthReps)
                        .keyboardType(.numberPad)
                }

                DatePicker("Date", selection: $loggedDate, displayedComponents: .date)
        }
        .navigationTitle("Log Workout")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            if sheetIsPresented != nil {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        sheetIsPresented?.wrappedValue = false
                    }
                }
            }
            ToolbarItem(placement: .confirmationAction) {
                Button("Save") { saveLog() }
                    .disabled(!canSave)
            }
        }
        .onAppear {
            if selectedExerciseId.isEmpty, let first = exercises.first {
                selectedExerciseId = first.id
            }
        }
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
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let dateStr = formatter.string(from: loggedDate)

        switch tab {
        case .cardio:
            let amount = Double(cardioAmount) ?? 0
            let log = WorkoutLog(
                id: "log-\(UUID().uuidString)",
                groupId: appState.group.id,
                weekChallengeId: challenge.id,
                userId: appState.currentUserId,
                loggedAt: dateStr,
                logType: .cardio,
                cardioActivity: cardioActivity,
                cardioAmount: amount
            )
            appState.addLog(log)
        case .strength:
            let reps = Int(strengthReps) ?? 0
            let log = WorkoutLog(
                id: "log-\(UUID().uuidString)",
                groupId: appState.group.id,
                weekChallengeId: challenge.id,
                userId: appState.currentUserId,
                loggedAt: dateStr,
                logType: .strength,
                exerciseId: selectedExerciseId,
                strengthReps: reps
            )
            appState.addLog(log)
        }
        if let sheetIsPresented {
            sheetIsPresented.wrappedValue = false
        } else {
            dismiss()
        }
    }
}
