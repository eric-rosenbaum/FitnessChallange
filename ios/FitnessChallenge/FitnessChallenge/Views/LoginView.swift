//
//  LoginView.swift
//  FitnessChallenge
//

import SwiftUI

struct LoginView: View {
    @Bindable var appState: AppState

    var body: some View {
        VStack(spacing: 24) {
            Spacer()
            Text("FriendsFitnessChallenge")
                .font(.title)
                .fontWeight(.bold)
                .multilineTextAlignment(.center)
            Text("Dummy login – tap to continue")
                .font(.subheadline)
                .foregroundStyle(.secondary)
            Spacer()
            Button(action: {
                appState.login()
            }) {
                Text("Sign In (Dummy)")
                    .fontWeight(.medium)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Theme.brown)
                    .foregroundStyle(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            .padding(.horizontal, 32)
            .padding(.bottom, 48)
        }
    }
}
