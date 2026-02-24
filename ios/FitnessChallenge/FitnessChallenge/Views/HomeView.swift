//
//  HomeView.swift
//  FitnessChallenge
//

import SwiftUI

struct HomeView: View {
    @Bindable var appState: AppState
    var onProfile: () -> Void
    var onSettings: () -> Void

    @State private var createChallengeAssignment: WeekAssignment?

    private var activeWeek: ActiveWeek { appState.activeWeek }
    private var challenge: WeekChallenge? { activeWeek.challenge }

    var body: some View {
        GeometryReader { geo in
            ScrollView {
                VStack(spacing: 16) {
                if let assignment = appState.upcomingAssignmentForUser {
                    UpcomingHostBanner(weekAssignment: assignment) {
                        createChallengeAssignment = assignment
                    }
                }
                if appState.useSupabase && appState.isLoading && challenge == nil {
                    ProgressView("Loading…")
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 40)
                } else if let ch = challenge {
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
            .frame(minHeight: geo.size.height + 1)
        }
        .refreshable { await appState.refresh() }
        }
        .background(Color(.systemGroupedBackground))
        .sheet(item: $createChallengeAssignment) { assignment in
            CreateChallengeSheet(appState: appState, assignment: assignment)
        }
        .onAppear {
            let ch = challenge != nil
            print("[FitnessChallenge.Dashboard] HomeView onAppear useSupabase=\(appState.useSupabase) challenge=\(ch) logs=\(appState.logs.count) leaderboard=\(appState.leaderboard.count) loadError=\(appState.loadError ?? "nil")")
        }
    }
}
