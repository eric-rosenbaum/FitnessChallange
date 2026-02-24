//
//  CreateChallengeSheet.swift
//  FitnessChallenge
//
//  Sheet to create a challenge for an upcoming week assignment. Used when user taps "You're the host" banner.
//

import SwiftUI

struct CreateChallengeSheet: View {
    @Bindable var appState: AppState
    let assignment: WeekAssignment
    @Environment(\.dismiss) private var dismiss

    @State private var cardioMetric: CardioMetric = .miles
    @State private var cardioTarget: String = ""
    @State private var exercises: [(name: String, reps: Int)] = []
    @State private var exerciseName: String = ""
    @State private var exerciseReps: String = ""
    @State private var isSaving = false
    @State private var isEditMode = false
    @State private var isLoading = true

    private var weekLabel: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.timeZone = TimeZone.current
        guard let date = formatter.date(from: String(assignment.startDate.prefix(10))) else {
            return assignment.startDate
        }
        formatter.dateFormat = "MMM d, yyyy"
        return formatter.string(from: date)
    }

    var body: some View {
        NavigationStack {
            Form {
                if isLoading {
                    Section {
                        ProgressView("Loading…")
                    }
                }
                Section {
                    Text("Week of \(weekLabel)")
                        .font(.subheadline)
                }
                Section("Challenge") {
                    Picker("Cardio metric", selection: $cardioMetric) {
                        ForEach(CardioMetric.allCases, id: \.self) { Text($0.displayName).tag($0) }
                    }
                    TextField("Cardio target", text: $cardioTarget)
                        .keyboardType(.decimalPad)
                }
                Section("Exercises") {
                    ForEach(Array(exercises.enumerated()), id: \.offset) { item in
                        HStack {
                            Text(item.element.name)
                            Spacer()
                            Text("\(item.element.reps) reps")
                                .foregroundStyle(.secondary)
                        }
                    }
                    HStack {
                        TextField("Name", text: $exerciseName)
                        TextField("Reps", text: $exerciseReps)
                            .keyboardType(.numberPad)
                        Button("Add") {
                            guard let reps = Int(exerciseReps), !exerciseName.isEmpty else { return }
                            exercises.append((name: exerciseName, reps: reps))
                            exerciseName = ""
                            exerciseReps = ""
                        }
                        .foregroundStyle(Theme.brown)
                    }
                }
            }
            .navigationTitle(isEditMode ? "Edit Challenge" : "Create Challenge")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(isEditMode ? "Update" : "Create") {
                        saveChallenge()
                    }
                    .disabled(!canSave || isSaving || isLoading)
                    .fontWeight(.semibold)
                }
            }
            .task {
                await loadExistingChallenge()
            }
        }
    }

    private func loadExistingChallenge() async {
        let result = await appState.getChallengeForAssignment(assignmentId: assignment.id)
        if let (ch, exs) = result {
            isEditMode = true
            cardioMetric = ch.cardioMetric
            cardioTarget = String(Int(ch.cardioTarget))
            exercises = exs.map { (name: $0.name, reps: $0.targetReps) }
        }
        isLoading = false
    }

    private var canSave: Bool {
        Double(cardioTarget) != nil && !exercises.isEmpty
    }

    private func saveChallenge() {
        guard let target = Double(cardioTarget), !exercises.isEmpty, !isSaving else { return }
        isSaving = true
        let exs = exercises.map { (name: $0.name, targetReps: $0.reps) }
        if isEditMode {
            appState.updateChallengeForAssignment(assignmentId: assignment.id, cardioMetric: cardioMetric, cardioTarget: target, exercises: exs)
        } else {
            appState.createChallengeForAssignment(assignmentId: assignment.id, cardioMetric: cardioMetric, cardioTarget: target, exercises: exs)
        }
        dismiss()
    }
}
