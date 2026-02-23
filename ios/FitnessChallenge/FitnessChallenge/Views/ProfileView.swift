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
                Button("Sign Out", role: .destructive, action: onSignOut)
            }
        }
        .navigationTitle("Profile")
        .onAppear {
            editingNameValue = appState.currentUserDisplayName
        }
    }
}
