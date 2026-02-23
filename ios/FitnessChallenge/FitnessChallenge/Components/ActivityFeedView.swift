//
//  ActivityFeedView.swift
//  FitnessChallenge
//

import SwiftUI

struct ActivityFeedView: View {
    let items: [ActivityFeedItem]

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Activity Feed")
                .font(.headline)
                .foregroundStyle(.primary)
            if items.isEmpty {
                Text("No activity yet.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .padding(.vertical, 8)
            } else {
                VStack(alignment: .leading, spacing: 8) {
                    ForEach(items) { item in
                        HStack(alignment: .top, spacing: 8) {
                            Text(item.displayName)
                                .font(.subheadline)
                                .fontWeight(.semibold)
                            Text(activityText(item))
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                            Spacer(minLength: 0)
                        }
                        .padding(8)
                        .background(Color.gray.opacity(0.05))
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                    }
                }
            }
        }
        .modifier(GlassCardStyle())
    }

    private func activityText(_ item: ActivityFeedItem) -> String {
        switch item.logType {
        case .cardio:
            let activity = item.cardioActivity?.displayName ?? "Cardio"
            let amount = item.cardioAmount.map { String(format: "%.1f", $0) } ?? "?"
            return "\(activity): \(amount)"
        case .strength:
            let name = item.exerciseName ?? "Exercise"
            let reps = item.strengthReps.map { "\($0)" } ?? "?"
            return "\(name): \(reps) reps"
        }
    }
}
