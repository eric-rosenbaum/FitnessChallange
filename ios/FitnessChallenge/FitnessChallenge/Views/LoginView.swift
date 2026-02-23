//
//  LoginView.swift
//  FitnessChallenge
//

import SwiftUI

struct LoginView: View {
    @Bindable var appState: AppState
    @State private var email = ""
    @State private var password = ""
    @State private var isSignUp = false
    @State private var isLoading = false
    @State private var message = ""

    var body: some View {
        VStack(spacing: 24) {
            Spacer()
            Text("FriendsFitnessChallenge")
                .font(.title)
                .fontWeight(.bold)
                .multilineTextAlignment(.center)
            if appState.useSupabase {
                Text("Sign in with your account")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                TextField("Email", text: $email)
                    .textFieldStyle(.roundedBorder)
                    .textInputAutocapitalization(.never)
                    .keyboardType(.emailAddress)
                    .padding(.horizontal, 32)
                SecureField("Password", text: $password)
                    .textFieldStyle(.roundedBorder)
                    .padding(.horizontal, 32)
                if !message.isEmpty {
                    Text(message)
                        .font(.caption)
                        .foregroundStyle(.red)
                        .padding(.horizontal, 32)
                }
                Button(action: submit, label: {
                    SwiftUI.Group {
                        if isLoading {
                            ProgressView()
                                .tint(.white)
                        } else {
                            Text(isSignUp ? "Sign Up" : "Sign In")
                        }
                    }
                    .fontWeight(.medium)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Theme.brown)
                    .foregroundStyle(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                })
                .disabled(isLoading || email.isEmpty || password.isEmpty)
                .padding(.horizontal, 32)
                Button(isSignUp ? "Already have an account? Sign In" : "Create an account", action: {
                    isSignUp.toggle()
                    message = ""
                })
                .font(.caption)
                .foregroundStyle(Theme.brown)
            } else {
                Text("Dummy login – tap to continue")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                Button(action: appState.login, label: {
                    Text("Sign In (Dummy)")
                        .fontWeight(.medium)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Theme.brown)
                        .foregroundStyle(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                })
                .padding(.horizontal, 32)
            }
            Spacer()
        }
        .padding(.bottom, 48)
    }

    private func submit() {
        message = ""
        isLoading = true
        Task {
            do {
                if isSignUp {
                    try await appState.signUp(email: email, password: password)
                } else {
                    try await appState.signIn(email: email, password: password)
                }
            } catch {
                message = error.localizedDescription
            }
            isLoading = false
        }
    }
}
