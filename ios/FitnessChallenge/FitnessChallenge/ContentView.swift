//
//  ContentView.swift
//  FitnessChallenge
//
//  Root: Login → Onboarding → [Create/Join Group] → Main (tabs).
//

import SwiftUI

struct ContentView: View {
    @State private var appState = AppState()

    var body: some View {
        SwiftUI.Group {
            if appState.authLoading && appState.useSupabase && !appState.hasGroup {
                ProgressView("Loading…")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if !appState.isLoggedIn {
                LoginView(appState: appState)
            } else if !appState.hasOnboarded {
                OnboardingView(appState: appState)
            } else if appState.useSupabase && !appState.hasGroup {
                CreateOrJoinGroupView(appState: appState)
            } else {
                MainTabView(appState: appState)
            }
        }
        .task {
            if appState.useSupabase {
                await appState.checkSession()
            }
        }
        .animation(Animation.easeInOut(duration: 0.25), value: appState.isLoggedIn)
        .animation(Animation.easeInOut(duration: 0.25), value: appState.hasOnboarded)
        .animation(Animation.easeInOut(duration: 0.25), value: appState.hasGroup)
    }
}

#Preview {
    ContentView()
}
