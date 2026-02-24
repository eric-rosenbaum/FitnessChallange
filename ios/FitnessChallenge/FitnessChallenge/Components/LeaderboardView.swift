//
//  LeaderboardView.swift
//  FitnessChallenge
//

import SwiftUI

struct LeaderboardView: View {
    let progressList: [UserProgress]
    let currentUserId: String
    let exercises: [StrengthExercise]
    let challenge: WeekChallenge?

    private static let displayLimit = 3
    @State private var showAll = false

    private var displayedItems: [UserProgress] {
        showAll ? progressList : Array(progressList.prefix(Self.displayLimit))
    }

    private var cardioMetricSuffix: String {
        challenge?.cardioMetric == .minutes ? "min" : "mi"
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Leaderboard")
                    .font(.headline)
                    .foregroundStyle(.primary)
                Spacer()
                if progressList.count > Self.displayLimit {
                    Button(showAll ? "Hide all" : "Show all") {
                        showAll.toggle()
                    }
                    .font(.caption.weight(.medium))
                    .foregroundStyle(Theme.brown)
                }
            }
            VStack(spacing: 8) {
                ForEach(displayedItems) { progress in
                    let isYou = progress.userId.lowercased() == currentUserId.lowercased()
                    VStack(alignment: .leading, spacing: 6) {
                        HStack(spacing: 12) {
                            Text("\(rank(for: progress))")
                                .font(.caption)
                                .fontWeight(.semibold)
                                .frame(width: 24, alignment: .center)
                            VStack(alignment: .leading, spacing: 4) {
                                Text(progress.displayName + (isYou ? " (You)" : ""))
                                    .font(.subheadline)
                                    .fontWeight(.medium)
                                GeometryReader { geo in
                                    ZStack(alignment: .leading) {
                                        RoundedRectangle(cornerRadius: 4)
                                            .fill(Color.gray.opacity(0.2))
                                        RoundedRectangle(cornerRadius: 4)
                                            .fill(Theme.brown.opacity(0.85))
                                            .frame(width: geo.size.width * min(CGFloat(progress.totalProgress), 1))
                                    }
                                }
                                .frame(height: 8)
                                if !breakdown(for: progress).isEmpty {
                                    Text(breakdown(for: progress))
                                        .font(.caption2)
                                        .foregroundStyle(.secondary)
                                        .lineLimit(nil)
                                        .fixedSize(horizontal: false, vertical: true)
                                }
                            }
                            .frame(maxWidth: .infinity)
                            Text("\(Int(progress.totalProgress * 100))%")
                                .font(.caption)
                                .fontWeight(.medium)
                        }
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 10)
                    .background(isYou ? Color.green.opacity(0.08) : Color.clear)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                }
            }
        }
        .modifier(GlassCardStyle())
    }

    private func rank(for progress: UserProgress) -> Int {
        guard let i = progressList.firstIndex(where: { $0.userId == progress.userId }) else { return 0 }
        return i + 1
    }

    private func breakdown(for progress: UserProgress) -> String {
        var lines: [String] = []
        if progress.cardioTotal > 0 {
            lines.append("cardio: \(String(format: "%.1f", progress.cardioTotal)) \(cardioMetricSuffix)")
        }
        let strengthParts = exercises.compactMap { ex -> String? in
            let total = progress.exerciseTotals[ex.id] ?? 0
            guard total > 0 else { return nil }
            return "\(ex.name): \(total)"
        }
        if !strengthParts.isEmpty {
            lines.append(strengthParts.joined(separator: ", "))
        }
        return lines.joined(separator: "\n")
    }
}
