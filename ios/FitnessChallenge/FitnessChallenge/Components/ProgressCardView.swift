//
//  ProgressCardView.swift
//  FitnessChallenge
//

import SwiftUI

struct ProgressCardView: View {
    let progress: UserProgress
    let challenge: WeekChallenge
    let exercises: [StrengthExercise]
    let weekStartDate: String
    let weekEndDate: String
    let timeRemainingText: String
    let cardioBreakdown: [String: Double] // e.g. ["Run": 7.5, "Walk": 5.2]

    private var metricSuffix: String { challenge.cardioMetric == .miles ? "mi" : "min" }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Your Progress")
                    .font(.headline)
                    .foregroundStyle(.primary)
                Spacer()
                Text(timeRemainingText)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            HStack(spacing: 24) {
                // Cardio column: donut + total + breakdown (like Group Progress)
                VStack(spacing: 4) {
                    Text("Cardio")
                        .font(.caption)
                        .fontWeight(.semibold)
                    DonutView(progress: progress.cardioProgress, color: Theme.greenProgress, size: 90)
                        .padding(.top, 16)
                    Text(String(format: "%.1f / %.0f %@", progress.cardioTotal, challenge.cardioTarget, challenge.cardioMetric.displayName))
                        .font(.caption)
                        .padding(.top, 10)
                    ForEach(Array(cardioBreakdown.keys.sorted()), id: \.self) { key in
                        if let amount = cardioBreakdown[key] {
                            Text("\(key): \(String(format: "%.1f", amount)) \(metricSuffix)")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
                .frame(maxWidth: .infinity)
                // Strength column: donut + "% complete" + exercise breakdown (like Group Progress)
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
            HStack {
                Spacer()
                NavigationLink(value: "EditLogs") {
                    Label("Edit logs", systemImage: "pencil")
                        .font(.caption.weight(.medium))
                        .foregroundStyle(Theme.brown)
                }
            }
        }
        .modifier(GlassCardStyle())
    }
}

/// Donut ring: size = view diameter; stroke is centered on circle.
/// Inner radius = (size/2) - (strokeWidth/2), outer radius = (size/2) + (strokeWidth/2).
/// Adjust size at call site (ProgressCardView, GroupProgressCardView). Adjust thickness via strokeWidth below.
struct DonutView: View {
    let progress: Double
    var color: Color = Theme.greenProgress
    var size: CGFloat = 70
    /// Ring thickness. Larger = thicker ring (smaller hole). Currently ~32% of size, cap 24.
    private var strokeWidth: CGFloat { min(size * 0.22, 24) }

    var body: some View {
        ZStack {
            Circle()
                .stroke(Color.gray.opacity(0.2), lineWidth: strokeWidth)
            Circle()
                .trim(from: 0, to: min(progress, 1.0))
                .stroke(color.opacity(0.85), style: StrokeStyle(lineWidth: strokeWidth, lineCap: .round))
                .rotationEffect(.degrees(-90))
                .animation(.easeOut(duration: 0.6), value: progress)
            if progress >= 1.0 {
                Image(systemName: "checkmark")
                    .font(.title)
                    .fontWeight(.bold)
                    .transition(.scale.combined(with: .opacity))
            } else {
                Text("\(Int(progress * 100))%")
                    .font(.caption)
                    .fontWeight(.bold)
                    .contentTransition(.numericText())
            }
        }
        .animation(.easeOut(duration: 0.6), value: progress)
        .frame(width: size, height: size)
    }
}
