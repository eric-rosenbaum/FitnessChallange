//
//  ProfileView.swift
//  FitnessChallenge
//

import SwiftUI

struct ProfileView: View {
    @Bindable var appState: AppState
    var onSignOut: () -> Void

    @State private var isEditingName = false
    @State private var editingNameValue: String = ""
    @State private var showDeleteAccountAlert = false
    @State private var isDeletingAccount = false

    var body: some View {
        List {
            Section("Profile") {
                if isEditingName {
                    HStack {
                        TextField("Display name", text: $editingNameValue)
                            .textContentType(.name)
                        Button("Save") {
                            let trimmed = editingNameValue.trimmingCharacters(in: .whitespacesAndNewlines)
                            if !trimmed.isEmpty {
                                appState.updateMyDisplayName(trimmed)
                            }
                            isEditingName = false
                        }
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(Theme.brown)
                        Button("Cancel") {
                            editingNameValue = appState.currentUserDisplayName
                            isEditingName = false
                        }
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    }
                } else {
                    HStack {
                        Text(appState.currentUserDisplayName)
                            .foregroundStyle(.primary)
                        Spacer()
                        Button {
                            editingNameValue = appState.currentUserDisplayName
                            isEditingName = true
                        } label: {
                            Image(systemName: "pencil.circle.fill")
                                .font(.title2)
                                .foregroundStyle(Theme.brown)
                        }
                    }
                }
                HStack {
                    Text("Role")
                    Spacer()
                    Text(appState.isAdmin ? "Admin" : "Member")
                        .foregroundStyle(.secondary)
                }
            }
            Section {
                Link("Privacy Policy", destination: URL(string: "https://eric-rosenbaum.github.io/friendsfitnesschallenge-privacy/")!)
                    .foregroundStyle(Theme.brown)
            }
            Section {
                Button("Sign Out", role: .destructive, action: onSignOut)
                Button("Delete Account", role: .destructive) {
                    showDeleteAccountAlert = true
                }
                .disabled(isDeletingAccount)
            }
        }
        .navigationTitle("Profile")
        .alert("Are you sure?", isPresented: $showDeleteAccountAlert) {
            Button("Cancel", role: .cancel) { showDeleteAccountAlert = false }
            Button("Delete Account", role: .destructive) {
                deleteAccount()
            }
        } message: {
            Text("This will permanently delete your account and all your data. This action cannot be undone.")
        }
        .onAppear {
            editingNameValue = appState.currentUserDisplayName
        }
    }

    private func deleteAccount() {
        isDeletingAccount = true
        Task {
            do {
                try await appState.deleteAccount()
            } catch {
                await MainActor.run {
                    appState.loadError = error.localizedDescription
                    isDeletingAccount = false
                }
            }
        }
    }
}
