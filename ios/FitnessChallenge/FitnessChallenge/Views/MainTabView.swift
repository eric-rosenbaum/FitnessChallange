//
//  MainTabView.swift
//  FitnessChallenge
//

import SwiftUI

struct MainTabView: View {
    @Bindable var appState: AppState
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
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
                    } else if dest == "EditLogs" {
                        EditLogsView(appState: appState)
                    }
                }
            }
            .tabItem {
                Label("Home", systemImage: "house.fill")
            }
            .tag(0)

            NavigationStack {
                LogView(appState: appState, onSaveSwitchToHome: { selectedTab = 0 })
            }
            .tabItem {
                Label("Log", systemImage: "plus.circle.fill")
            }
            .tag(1)

            NavigationStack {
                SettingsView(appState: appState)
            }
            .tabItem {
                Label("Group", systemImage: "person.3.fill")
            }
            .tag(2)
        }
        .tint(Theme.brown)
    }
}
