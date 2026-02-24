//
//  ActivityFeedView.swift
//  FitnessChallenge
//

import SwiftUI

struct ActivityFeedView: View {
    let items: [ActivityFeedItem]
    private let displayLimit = 5

    @State private var showAllActivity = false

    private var displayedItems: [ActivityFeedItem] {
        Array(items.prefix(displayLimit))
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Activity Feed")
                    .font(.headline)
                    .foregroundStyle(.primary)
                Spacer()
                if items.count > displayLimit {
                    Button("See all") {
                        showAllActivity = true
                    }
                    .font(.caption.weight(.medium))
                    .foregroundStyle(Theme.brown)
                }
            }
            if items.isEmpty {
                Text("No activity yet.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .padding(.vertical, 8)
            } else {
                VStack(alignment: .leading, spacing: 8) {
                    ForEach(displayedItems) { item in
                        activityRow(item)
                    }
                }
            }
        }
        .modifier(GlassCardStyle())
        .sheet(isPresented: $showAllActivity) {
            AllActivityFeedView(items: items)
        }
    }

    private func activityRow(_ item: ActivityFeedItem) -> some View {
        HStack(alignment: .top, spacing: 8) {
            Text(item.displayName)
                .font(.subheadline)
                .fontWeight(.semibold)
            Text(activityText(item))
                .font(.subheadline)
                .foregroundStyle(.secondary)
            Spacer(minLength: 0)
            Text(formatActivityTimestamp(item.createdAt))
                .font(.caption)
                .foregroundStyle(.tertiary)
        }
        .padding(8)
        .background(Color.gray.opacity(0.05))
        .clipShape(RoundedRectangle(cornerRadius: 10))
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

struct AllActivityFeedView: View {
    let items: [ActivityFeedItem]
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 8) {
                    ForEach(items) { item in
                        HStack(alignment: .top, spacing: 8) {
                            Text(item.displayName)
                                .font(.subheadline)
                                .fontWeight(.semibold)
                            Text(activityText(item))
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                            Spacer(minLength: 0)
                            Text(formatActivityTimestamp(item.createdAt))
                                .font(.caption)
                                .foregroundStyle(.tertiary)
                        }
                        .padding(8)
                        .background(Color.gray.opacity(0.05))
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                    }
                }
                .padding()
            }
            .navigationTitle("All Activity")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                        .fontWeight(.semibold)
                        .foregroundStyle(Theme.brown)
                }
            }
        }
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

private func formatActivityTimestamp(_ createdAt: String) -> String {
    let iso = ISO8601DateFormatter()
    iso.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    var date = iso.date(from: createdAt)
    if date == nil {
        iso.formatOptions = [.withInternetDateTime]
        date = iso.date(from: createdAt)
    }
    if date == nil {
        let fallback = DateFormatter()
        fallback.dateFormat = "yyyy-MM-dd'T'HH:mm:ss"
        fallback.timeZone = TimeZone(identifier: "UTC")
        date = fallback.date(from: String(createdAt.prefix(19)))
    }
    if date == nil {
        let fallback = DateFormatter()
        fallback.dateFormat = "yyyy-MM-dd"
        date = fallback.date(from: String(createdAt.prefix(10)))
    }
    guard let d = date else { return "" }
    let cal = Calendar.current
    if cal.isDateInToday(d) {
        let tf = DateFormatter()
        tf.dateFormat = "h:mm a"
        tf.timeZone = TimeZone.current
        return tf.string(from: d)
    } else {
        let df = DateFormatter()
        df.dateFormat = "EEE h:mm a"
        df.timeZone = TimeZone.current
        return df.string(from: d)
    }
}
