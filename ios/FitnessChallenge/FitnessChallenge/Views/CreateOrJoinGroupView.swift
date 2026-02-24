//
//  CreateOrJoinGroupView.swift
//  FitnessChallenge
//
//  Shown when user is signed in but has no group. Create a new group or join with invite code.
//

import SwiftUI

struct CreateOrJoinGroupView: View {
    @Bindable var appState: AppState
    @State private var mode: Mode = .choose
    @State private var groupName = ""
    @State private var inviteCode = ""
    @State private var isLoading = false
    @State private var errorMessage = ""

    enum Mode {
        case choose
        case create
        case join
    }

    var body: some View {
        VStack(spacing: 24) {
            Text("Create or Join a Group")
                .font(.title)
                .fontWeight(.bold)
                .multilineTextAlignment(.center)
            Text("You need to be in a group to use the challenge.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)

            switch mode {
            case .choose:
                VStack(spacing: 16) {
                    Button(action: { mode = .create; errorMessage = "" }) {
                        Label("Create a new group", systemImage: "person.3.fill")
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Theme.brown.opacity(0.15))
                            .foregroundStyle(Theme.brown)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                    Button(action: { mode = .join; errorMessage = "" }) {
                        Label("Join with invite code", systemImage: "person.badge.plus")
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Theme.brown.opacity(0.15))
                            .foregroundStyle(Theme.brown)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                }
                .padding(.horizontal, 32)
            case .create:
                VStack(alignment: .leading, spacing: 8) {
                    Text("Group name")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    TextField("e.g. Fitness Friends", text: $groupName)
                        .textFieldStyle(.roundedBorder)
                    Text("Invite code (others will use this to join)")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    TextField("e.g. FIT2024", text: $inviteCode)
                        .textFieldStyle(.roundedBorder)
                        .textInputAutocapitalization(.characters)
                }
                .padding(.horizontal, 32)
                if !errorMessage.isEmpty {
                    Text(errorMessage)
                        .font(.caption)
                        .foregroundStyle(.red)
                        .padding(.horizontal, 32)
                }
                HStack(spacing: 12) {
                    Button(action: { mode = .choose; errorMessage = "" }) {
                        Text("Back")
                    }
                    .foregroundStyle(Theme.brown)
                    Button {
                        createGroup()
                    } label: {
                        SwiftUI.Group {
                            if isLoading {
                                ProgressView()
                                    .tint(.white)
                            } else {
                                Text("Create")
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(Theme.brown)
                    .foregroundStyle(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .disabled(isLoading || groupName.trimmingCharacters(in: .whitespaces).isEmpty || inviteCode.trimmingCharacters(in: .whitespaces).isEmpty)
                }
                .padding(.horizontal, 32)
            case .join:
                VStack(alignment: .leading, spacing: 8) {
                    Text("Invite code")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    TextField("Enter code from your group", text: $inviteCode)
                        .textFieldStyle(.roundedBorder)
                        .textInputAutocapitalization(.characters)
                }
                .padding(.horizontal, 32)
                if !errorMessage.isEmpty {
                    Text(errorMessage)
                        .font(.caption)
                        .foregroundStyle(.red)
                        .padding(.horizontal, 32)
                }
                HStack(spacing: 12) {
                    Button(action: { mode = .choose; errorMessage = "" }) {
                        Text("Back")
                    }
                    .foregroundStyle(Theme.brown)
                    Button {
                        joinGroup()
                    } label: {
                        SwiftUI.Group {
                            if isLoading {
                                ProgressView()
                                    .tint(.white)
                            } else {
                                Text("Join")
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(Theme.brown)
                    .foregroundStyle(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .disabled(isLoading || inviteCode.trimmingCharacters(in: .whitespaces).isEmpty)
                }
                .padding(.horizontal, 32)
            }
            Spacer()
        }
        .padding(.top, 32)
    }

    private func createGroup() {
        guard !isLoading else { return }
        let name = groupName.trimmingCharacters(in: .whitespaces)
        let code = inviteCode.trimmingCharacters(in: .whitespaces)
        guard !name.isEmpty, !code.isEmpty else { return }
        errorMessage = ""
        isLoading = true
        Task { @MainActor in
            defer { isLoading = false }
            do {
                try await appState.createGroup(name: name, inviteCode: code.uppercased())
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }

    private func joinGroup() {
        guard !isLoading else { return }
        errorMessage = ""
        isLoading = true
        Task { @MainActor in
            defer { isLoading = false }
            do {
                try await appState.joinGroup(inviteCode: inviteCode)
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }
}
