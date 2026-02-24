//
//  GroupProgressCardView.swift
//  FitnessChallenge
//
//  Group progress with donut style matching web: Cardio (green) + Strength (blue), breakdowns.
//

import SwiftUI

struct GroupProgressCardView: View {
    let challenge: WeekChallenge
    let exercises: [StrengthExercise]
    let weekStartDate: String
    let weekEndDate: String
    let groupCardioTotal: Double
    let groupCardioTarget: Double
    let groupCardioProgress: Double
    let groupStrengthProgress: Double
    let groupCardioBreakdown: [String: Double]
    let groupExerciseTotals: [String: Int]
    let numberOfMembers: Int
    let timeRemainingText: String

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Group Progress")
                    .font(.headline)
                    .foregroundStyle(.primary)
                Spacer()
                Text(timeRemainingText)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            HStack(alignment: .top, spacing: 24) {
                // Cardio
                VStack(spacing: 4) {
                    Text("Cardio")
                        .font(.caption)
                        .fontWeight(.semibold)
                    DonutView(progress: groupCardioProgress, color: Theme.greenProgress, size: 90)
                        .padding(.top, 16)
                    Text(String(format: "%.1f / %.1f %@", groupCardioTotal, groupCardioTarget, challenge.cardioMetric.displayName))
                        .font(.caption)
                        .padding(.top, 10)
                    ForEach(Array(groupCardioBreakdown.keys.sorted()), id: \.self) { key in
                        if let amount = groupCardioBreakdown[key] {
                            Text("\(key): \(String(format: "%.1f", amount)) \(challenge.cardioMetric == .miles ? "mi" : "min")")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
                .frame(maxWidth: .infinity)
                // Strength
                VStack(spacing: 4) {
                    Text("Strength")
                        .font(.caption)
                        .fontWeight(.semibold)
                    DonutView(progress: groupStrengthProgress, color: Theme.strengthBlue, size: 90)
                        .padding(.top, 16)
                    Text("\(Int(groupStrengthProgress * 100))% complete")
                        .font(.caption)
                        .padding(.top, 10)
                    ForEach(exercises) { ex in
                        let total = groupExerciseTotals[ex.id] ?? 0
                        let groupTarget = ex.targetReps * numberOfMembers
                        Text("\(ex.name): \(total) / \(groupTarget)")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
                .frame(maxWidth: .infinity)
            }
        }
        .modifier(GlassCardStyle())
    }
}
