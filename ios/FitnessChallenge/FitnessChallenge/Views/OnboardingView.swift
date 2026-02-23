//
//  OnboardingView.swift
//  FitnessChallenge
//
//  Set display name (saved to Supabase when configured).
//

import SwiftUI

struct OnboardingView: View {
    @Bindable var appState: AppState
    @State private var displayName: String = ""
    @State private var isLoading = false

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
            Button(action: saveAndContinue, label: {
                SwiftUI.Group {
                    if isLoading {
                        ProgressView()
                            .tint(.white)
                    } else {
                        Text("Continue")
                    }
                }
                .fontWeight(.medium)
                .frame(maxWidth: .infinity)
                .padding()
                .background(Theme.brown)
                .foregroundStyle(.white)
                .clipShape(RoundedRectangle(cornerRadius: 12))
            })
            .disabled(isLoading || displayName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            .padding(.horizontal, 32)
        }
        .padding()
        .onAppear {
            if displayName.isEmpty {
                displayName = appState.currentUserDisplayName
                if displayName == "You" { displayName = "" }
            }
        }
    }

    private func saveAndContinue() {
        let name = displayName.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !name.isEmpty else { return }
        isLoading = true
        appState.updateMyDisplayName(name)
        appState.setCurrentUserDisplayName(name)
        appState.completeOnboarding()
        isLoading = false
    }
}
