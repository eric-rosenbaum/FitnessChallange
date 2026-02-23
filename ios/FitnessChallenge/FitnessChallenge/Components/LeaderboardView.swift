//
//  LeaderboardView.swift
//  FitnessChallenge
//

import SwiftUI

struct LeaderboardView: View {
    let progressList: [UserProgress]
    let currentUserId: String
    let exercises: [StrengthExercise]

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Leaderboard")
                .font(.headline)
                .foregroundStyle(.primary)
            VStack(spacing: 8) {
                ForEach(progressList) { progress in
                    let isYou = progress.userId == currentUserId
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
                        }
                        .frame(maxWidth: .infinity)
                        Text("\(Int(progress.totalProgress * 100))%")
                            .font(.caption)
                            .fontWeight(.medium)
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
}
