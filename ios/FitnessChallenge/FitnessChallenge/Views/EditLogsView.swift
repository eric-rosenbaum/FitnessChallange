//
//  EditLogsView.swift
//  FitnessChallenge
//
//  Edit or delete the current user's workout logs for the active challenge (matches web edit-logs page).
//

import SwiftUI

struct EditLogsView: View {
    @Bindable var appState: AppState
    @Environment(\.dismiss) private var dismiss

    private var challenge: WeekChallenge? { appState.challenge }
    private var exercises: [StrengthExercise] { appState.exercises }
    private var userLogs: [WorkoutLog] {
        guard let ch = challenge else { return [] }
        return appState.logs
            .filter { $0.userId == appState.currentUserId && $0.weekChallengeId == ch.id }
            .sorted { ($0.loggedAt + $0.id) > ($1.loggedAt + $1.id) }
    }

    @State private var editingLogId: String?
    @State private var editAmount: String = ""
    @State private var isSaving = false
    @State private var deletingLogId: String?
    @State private var showDeleteConfirm = false
    @State private var logToDelete: WorkoutLog?

    var body: some View {
        Group {
            if challenge == nil {
                ContentUnavailableView("No active challenge", systemImage: "dumbbell", description: Text("There is no challenge this week. Logs can be edited when a challenge is active."))
            } else if userLogs.isEmpty {
                VStack(spacing: 16) {
                    Text("You haven't logged any workouts yet")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                    Text("Use the Log tab to add a workout")
                        .font(.caption)
                        .foregroundStyle(.tertiary)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 40)
            } else {
                List {
                    ForEach(userLogs) { log in
                        if editingLogId == log.id {
                            editRow(log: log)
                        } else {
                            displayRow(log: log)
                        }
                    }
                }
                .listStyle(.insetGrouped)
            }
        }
        .navigationTitle("Edit Logs")
        .navigationBarTitleDisplayMode(.inline)
        .confirmationDialog("Delete log?", isPresented: $showDeleteConfirm, titleVisibility: .visible) {
            Button("Delete", role: .destructive) {
                if let log = logToDelete {
                    Task {
                        deletingLogId = log.id
                        await appState.deleteLog(logId: log.id)
                        deletingLogId = nil
                        logToDelete = nil
                    }
                }
            }
            Button("Cancel", role: .cancel) {
                logToDelete = nil
            }
        } message: {
            Text("Are you sure you want to delete this log?")
        }
    }

    private func displayRow(log: WorkoutLog) -> some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(logTypeLabel(log))
                    .font(.subheadline.fontWeight(.semibold))
                Text(amountLabel(log))
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Text(formattedDate(log.loggedAt))
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
            }
            Spacer()
            HStack(spacing: 8) {
                Button("Edit") {
                    editingLogId = log.id
                    if log.logType == .cardio {
                        editAmount = log.cardioAmount.map { String($0) } ?? ""
                    } else {
                        editAmount = log.strengthReps.map { String($0) } ?? ""
                    }
                }
                .font(.caption.weight(.medium))
                .foregroundStyle(Theme.brown)
                Button("Delete") {
                    logToDelete = log
                    showDeleteConfirm = true
                }
                .font(.caption.weight(.medium))
                .foregroundStyle(.red)
                .disabled(deletingLogId == log.id)
            }
        }
        .padding(.vertical, 4)
    }

    private func editRow(log: WorkoutLog) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(logTypeLabel(log))
                .font(.subheadline.fontWeight(.medium))
            HStack {
                TextField(log.logType == .cardio ? "Amount" : "Reps", text: $editAmount)
                    .keyboardType(log.logType == .cardio ? .decimalPad : .numberPad)
                    .frame(width: 80)
                Text(log.logType == .cardio ? (challenge?.cardioMetric == .miles ? "mi" : "min") : "reps")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Spacer()
                Button("Cancel") {
                    editingLogId = nil
                    editAmount = ""
                }
                .font(.caption.weight(.medium))
                Button("Save") {
                    saveEdit(log)
                }
                .font(.caption.weight(.semibold))
                .foregroundStyle(Theme.brown)
                .disabled(isSaving || editAmount.isEmpty)
            }
        }
        .padding(.vertical, 4)
    }

    private func logTypeLabel(_ log: WorkoutLog) -> String {
        if log.logType == .cardio, let act = log.cardioActivity {
            return act.displayName
        }
        if log.logType == .strength, let exId = log.exerciseId, let ex = exercises.first(where: { $0.id == exId }) {
            return ex.name
        }
        return log.logType == .cardio ? "Cardio" : "Strength"
    }

    private func amountLabel(_ log: WorkoutLog) -> String {
        if log.logType == .cardio, let amt = log.cardioAmount {
            return String(format: "%.1f %@", amt, challenge?.cardioMetric == .miles ? "mi" : "min")
        }
        if log.logType == .strength, let reps = log.strengthReps {
            return "\(reps) reps"
        }
        return ""
    }

    private func formattedDate(_ dateStr: String) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        guard let d = formatter.date(from: String(dateStr.prefix(10))) else { return dateStr }
        formatter.dateFormat = "MMM d"
        return formatter.string(from: d)
    }

    private func saveEdit(_ log: WorkoutLog) {
        guard challenge != nil else { return }
        isSaving = true
        if log.logType == .cardio, let amount = Double(editAmount) {
            Task {
                await appState.updateLog(logId: log.id, cardioAmount: amount)
                await MainActor.run {
                    editingLogId = nil
                    editAmount = ""
                    isSaving = false
                }
            }
        } else if log.logType == .strength, let reps = Int(editAmount) {
            Task {
                await appState.updateLog(logId: log.id, strengthReps: reps)
                await MainActor.run {
                    editingLogId = nil
                    editAmount = ""
                    isSaving = false
                }
            }
        } else {
            isSaving = false
        }
    }
}
