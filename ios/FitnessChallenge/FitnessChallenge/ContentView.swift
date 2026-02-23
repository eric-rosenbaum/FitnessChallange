//
//  ContentView.swift
//  FitnessChallenge
//
//  Root: Login → Onboarding → Main (tabs).
//

import SwiftUI

struct ContentView: View {
    @State private var appState = AppState()

    var body: some View {
        SwiftUI.Group {
            if !appState.isLoggedIn {
                LoginView(appState: appState)
            } else if !appState.hasOnboarded {
                OnboardingView(appState: appState)
            } else {
                MainTabView(appState: appState)
            }
        }
        .animation(Animation.easeInOut(duration: 0.25), value: appState.isLoggedIn)
        .animation(Animation.easeInOut(duration: 0.25), value: appState.hasOnboarded)
    }
}

#Preview {
    ContentView()
}
