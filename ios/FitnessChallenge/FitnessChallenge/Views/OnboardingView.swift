//
//  OnboardingView.swift
//  FitnessChallenge
//
//  Set display name (dummy: stored in app state only for this session).
//

import SwiftUI

struct OnboardingView: View {
    @Bindable var appState: AppState
    @State private var displayName: String = DummyData.profile(for: DummyData.currentUserId)?.displayName ?? "You"

    var body: some View {
        VStack(spacing: 24) {
            Text("Welcome!")
                .font(.title)
                .fontWeight(.bold)
            Text("Choose your display name")
                .font(.subheadline)
                .foregroundStyle(.secondary)
            TextField("Display name", text: $displayName)
                .textFieldStyle(.roundedBorder)
                .padding(.horizontal, 32)
            Button(action: {
                appState.completeOnboarding()
            }) {
                Text("Continue")
                    .fontWeight(.medium)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Theme.brown)
                    .foregroundStyle(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            .padding(.horizontal, 32)
        }
        .padding()
    }
}
