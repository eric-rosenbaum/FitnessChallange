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
                    if let ap = appState.activePunishment, let prog = appState.punishmentProgress {
                        PunishmentProgressCardView(
                            progress: prog,
                            punishment: ap.punishment,
                            exercises: ap.exercises,
                            logs: appState.punishmentLogs,
                            userId: appState.currentUserId,
                            timeRemainingText: AppState.punishmentTimeRemaining(endDate: ap.punishment.endDate)
                        )
                        PunishmentLeaderboardView(
                            progressList: appState.punishmentLeaderboard,
                            currentUserId: appState.currentUserId,
                            exercises: ap.exercises,
                            punishment: ap.punishment,
                            logs: appState.punishmentLogs,
                            titleOverride: "Punishment Progress"
                        )
                    } else if let lp = appState.leaderboardPunishment, !appState.punishmentLeaderboard.isEmpty {
                        PunishmentLeaderboardView(
                            progressList: appState.punishmentLeaderboard,
                            currentUserId: appState.currentUserId,
                            exercises: lp.exercises,
                            punishment: lp.punishment,
                            logs: appState.punishmentLogs
                        )
                    }
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
                        exercises: appState.exercises,
                        challenge: ch
                    )
                    ActivityFeedView(items: appState.activityFeed)
                    ProgressOverTimeChartView(
                        chartPoints: appState.progressOverTimeChartPoints,
                        progressList: appState.leaderboard,
                        weekStartDate: activeWeek.weekAssignment.startDate,
                        weekEndDate: activeWeek.weekAssignment.endDate
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
        .onAppear {
            let ch = challenge != nil
            print("[FitnessChallenge.Dashboard] HomeView onAppear useSupabase=\(appState.useSupabase) challenge=\(ch) logs=\(appState.logs.count) leaderboard=\(appState.leaderboard.count) loadError=\(appState.loadError ?? "nil")")
        }
    }
}
