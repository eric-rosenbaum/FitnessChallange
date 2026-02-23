//
//  TopBarView.swift
//  FitnessChallenge
//

import SwiftUI

struct TopBarView: View {
    @Bindable var appState: AppState
    var challengeCreatedBy: String?

    var body: some View {
        HStack(spacing: 12) {
            NavigationLink(value: "Profile") {
                Image(systemName: "person.circle.fill")
                    .font(.title2)
                    .foregroundStyle(Theme.brown)
            }
            Spacer()
            VStack(spacing: 2) {
                Text("FriendsFitnessChallenge")
                    .font(.subheadline)
                    .fontWeight(.bold)
                    .foregroundStyle(.primary)
                if let by = challengeCreatedBy {
                    Text("Challenge by: \(by)")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }
            Spacer()
            NavigationLink(value: "Settings") {
                Image(systemName: "person.3.fill")
                    .font(.title2)
                    .foregroundStyle(Theme.brown)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(Theme.cardBackground.shadow(color: .black.opacity(0.08), radius: 4, y: 2))
    }
}
