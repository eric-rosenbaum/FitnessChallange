//
//  MainTabView.swift
//  FitnessChallenge
//

import SwiftUI

struct MainTabView: View {
    @Bindable var appState: AppState

    var body: some View {
        TabView {
            NavigationStack {
                VStack(spacing: 0) {
                    TopBarView(
                        appState: appState,
                        challengeCreatedBy: appState.activeWeek.challenge != nil ? appState.activeWeek.hostName : nil
                    )
                    HomeView(
                        appState: appState,
                        onProfile: {},
                        onSettings: {}
                    )
                }
                .navigationBarHidden(true)
                .navigationDestination(for: String.self) { dest in
                    if dest == "Profile" {
                        ProfileView(appState: appState, onSignOut: { appState.signOut() })
                    } else if dest == "Settings" {
                        SettingsView(appState: appState)
                    }
                }
            }
            .tabItem {
                Label("Home", systemImage: "house.fill")
            }

            NavigationStack {
                LogView(appState: appState)
            }
            .tabItem {
                Label("Log", systemImage: "plus.circle.fill")
            }

            NavigationStack {
                SettingsView(appState: appState)
            }
            .tabItem {
                Label("Group", systemImage: "person.3.fill")
            }
        }
        .tint(Theme.brown)
    }
}
