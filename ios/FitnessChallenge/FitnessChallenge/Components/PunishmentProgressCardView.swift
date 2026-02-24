//
//  PunishmentProgressCardView.swift
//  FitnessChallenge
//
//  Punishment progress for the current user (cardio + strength donuts, time left). Matches web PunishmentProgressCard.
//

import SwiftUI

struct PunishmentProgressCardView: View {
    let progress: PunishmentProgress
    let punishment: Punishment
    let exercises: [PunishmentExercise]
    let logs: [PunishmentLog]
    let userId: String
    /// Precomputed time remaining, e.g. "2 days 5 hrs left"
    let timeRemainingText: String

    private var metricSuffix: String { (punishment.cardioMetric ?? .miles).displayName.lowercased().hasPrefix("min") ? "min" : "mi" }
    private var userCardioBreakdown: [String: Double] {
        var out: [String: Double] = [:]
        let uid = userId.lowercased()
        for log in logs where log.userId.lowercased() == uid && log.logType == .cardio {
            guard let activity = log.cardioActivity, let amount = log.cardioAmount else { continue }
            let key = activity.displayName
            out[key, default: 0] += amount
        }
        return out
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Punishment Progress")
                    .font(.headline)
                    .foregroundStyle(.primary)
                Spacer()
                Text(timeRemainingText)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            HStack(spacing: 24) {
                if punishment.cardioTarget != nil, punishment.cardioMetric != nil {
                    VStack(spacing: 4) {
                        Text("Cardio")
                            .font(.caption)
                            .fontWeight(.semibold)
                        DonutView(progress: progress.cardioProgress, color: Theme.greenProgress, size: 90)
                            .padding(.top, 16)
                        Text(String(format: "%.1f / %.1f %@", progress.cardioTotal, punishment.cardioTarget ?? 0, metricSuffix))
                            .font(.caption)
                            .padding(.top, 10)
                        ForEach(Array(userCardioBreakdown.keys.sorted()), id: \.self) { key in
                            if let amount = userCardioBreakdown[key] {
                                Text("\(key): \(String(format: "%.1f", amount)) \(metricSuffix)")
                                    .font(.caption2)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                    .frame(maxWidth: .infinity)
                }
                if !exercises.isEmpty {
                    VStack(spacing: 4) {
                        Text("Strength")
                            .font(.caption)
                            .fontWeight(.semibold)
                        DonutView(progress: progress.strengthOverallProgress, color: Theme.strengthBlue, size: 90)
                            .padding(.top, 16)
                        Text("\(Int(progress.strengthOverallProgress * 100))% complete")
                            .font(.caption)
                            .padding(.top, 10)
                        ForEach(exercises) { ex in
                            let total = progress.exerciseTotals[ex.id] ?? 0
                            Text("\(ex.name): \(total) / \(ex.targetReps)")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                    }
                    .frame(maxWidth: .infinity)
                }
            }
        }
        .padding()
        .background(Theme.redPunishmentCard.opacity(0.4))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(Theme.redPunishmentCard.opacity(0.5), lineWidth: 1))
    }
}
