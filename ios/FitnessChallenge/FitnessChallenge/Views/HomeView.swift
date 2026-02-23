//
//  HomeView.swift
//  FitnessChallenge
//

import SwiftUI

struct HomeView: View {
    @Bindable var appState: AppState
    var onProfile: () -> Void
    var onSettings: () -> Void

    private var activeWeek: ActiveWeek { appState.activeWeek }
    private var challenge: WeekChallenge? { activeWeek.challenge }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if let ch = challenge {
                    ProgressCardView(
                        progress: appState.currentUserProgress,
                        challenge: ch,
                        exercises: appState.exercises,
                        weekStartDate: activeWeek.weekAssignment.startDate,
                        weekEndDate: activeWeek.weekAssignment.endDate,
                        timeRemainingText: appState.timeRemainingText,
                        cardioBreakdown: appState.currentUserCardioBreakdown
                    )
                    GroupProgressCardView(
                        challenge: ch,
                        exercises: appState.exercises,
                        weekStartDate: activeWeek.weekAssignment.startDate,
                        weekEndDate: activeWeek.weekAssignment.endDate,
                        groupCardioTotal: appState.groupCardioTotal,
                        groupCardioTarget: appState.groupCardioTarget,
                        groupCardioProgress: appState.groupCardioProgress,
                        groupStrengthProgress: appState.groupStrengthProgress,
                        groupCardioBreakdown: appState.groupCardioBreakdown,
                        groupExerciseTotals: appState.groupExerciseTotals,
                        numberOfMembers: appState.numberOfMembers,
                        timeRemainingText: appState.timeRemainingText
                    )
                    LeaderboardView(
                        progressList: appState.leaderboard,
                        currentUserId: appState.currentUserId,
                        exercises: appState.exercises
                    )
                    ActivityFeedView(items: appState.activityFeed)
                    ProgressOverTimeChartView(
                        chartPoints: appState.progressOverTimeChartPoints,
                        progressList: appState.leaderboard
                    )
                } else {
                    Text("No active challenge")
                        .font(.headline)
                        .foregroundStyle(.secondary)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 40)
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
    }
}
