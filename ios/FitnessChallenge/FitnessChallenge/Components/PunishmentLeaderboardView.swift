//
//  PunishmentLeaderboardView.swift
//  FitnessChallenge
//
//  Leaderboard for punishment progress (assigned users only). Matches web PunishmentLeaderboard.
//

import SwiftUI

struct PunishmentLeaderboardView: View {
    let progressList: [PunishmentProgress]
    let currentUserId: String
    let exercises: [PunishmentExercise]
    let punishment: Punishment
    let logs: [PunishmentLog]
    /// When set (e.g. "Punishment Progress"), used as card title. Otherwise: "Punishment (Name1, Name2)".
    var titleOverride: String?

    private var title: String {
        if let t = titleOverride, !t.isEmpty { return t }
        if progressList.isEmpty { return "Punishment Leaderboard" }
        return "Punishment (\(progressList.map(\.displayName).joined(separator: ", ")))"
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title)
                .font(.headline)
                .foregroundStyle(.primary)
            VStack(spacing: 8) {
                ForEach(progressList) { progress in
                    let isYou = progress.userId.lowercased() == currentUserId.lowercased()
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
                                        .fill(Theme.redPunishment.opacity(0.85))
                                        .frame(width: geo.size.width * min(CGFloat(progress.totalProgress), 1))
                                }
                            }
                            .frame(height: 8)
                            if !breakdown(for: progress.userId).isEmpty {
                                Text(breakdown(for: progress.userId))
                                    .font(.caption2)
                                    .foregroundStyle(.secondary)
                            }
                        }
                        .frame(maxWidth: .infinity)
                        Text("\(Int(progress.totalProgress * 100))%")
                            .font(.caption)
                            .fontWeight(.medium)
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 10)
                    .background(isYou ? Color.red.opacity(0.08) : Color.clear)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                }
            }
        }
        .padding()
        .background(
            LinearGradient(colors: [Theme.redPunishment.opacity(0.15), Theme.redPunishment.opacity(0.08)], startPoint: .topLeading, endPoint: .bottomTrailing)
        )
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.red.opacity(0.25), lineWidth: 1))
    }

    private func rank(for progress: PunishmentProgress) -> Int {
        guard let i = progressList.firstIndex(where: { $0.userId.lowercased() == progress.userId.lowercased() }) else { return 0 }
        return i + 1
    }

    private func breakdown(for userId: String) -> String {
        let uid = userId.lowercased()
        let userLogs = logs.filter { $0.userId.lowercased() == uid }
        var parts: [String] = []
        let cardioTotal = userLogs.filter { $0.logType == .cardio }.compactMap(\.cardioAmount).reduce(0, +)
        if cardioTotal > 0, punishment.cardioTarget != nil, punishment.cardioMetric != nil {
            let metric = (punishment.cardioMetric ?? .miles).displayName.lowercased().hasPrefix("min") ? "min" : "mi"
            parts.append("Cardio: \(String(format: "%.1f", cardioTotal)) \(metric)")
        }
        for ex in exercises {
            let total = userLogs.filter { $0.logType == .strength && $0.exerciseId == ex.id }.compactMap(\.strengthReps).reduce(0, +)
            if total > 0 { parts.append("\(ex.name): \(total)") }
        }
        return parts.joined(separator: "   ")
    }
}
