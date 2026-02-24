//
//  UpcomingHostBanner.swift
//  FitnessChallenge
//
//  Banner prompting user to choose exercises when they're the host for an upcoming week. Matches web UpcomingHostBanner.
//

import SwiftUI

struct UpcomingHostBanner: View {
    let weekAssignment: WeekAssignment
    var onTap: () -> Void

    private var weekLabel: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.timeZone = TimeZone.current
        guard let date = formatter.date(from: String(weekAssignment.startDate.prefix(10))) else {
            return weekAssignment.startDate
        }
        formatter.dateFormat = "MMM d, yyyy"
        return formatter.string(from: date)
    }

    var body: some View {
        Button(action: onTap) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("You're the host for Week of \(weekLabel)!")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(.primary)
                    Text("Set your exercises ahead of time")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                Image(systemName: "chevron.right")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(Theme.brown)
            }
            .padding()
            .background(
                LinearGradient(colors: [Color.orange.opacity(0.15), Color.orange.opacity(0.08)], startPoint: .topLeading, endPoint: .bottomTrailing)
            )
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .overlay(RoundedRectangle(cornerRadius: 16).stroke(Theme.brown.opacity(0.5), lineWidth: 2))
        }
        .buttonStyle(.plain)
    }
}
