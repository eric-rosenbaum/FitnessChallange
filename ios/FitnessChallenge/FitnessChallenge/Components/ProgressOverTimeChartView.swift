//
//  ProgressOverTimeChartView.swift
//  FitnessChallenge
//
//  Line chart: cumulative progress over the week, one line per participant, legend below.
//

import SwiftUI

struct ProgressOverTimeChartView: View {
    let chartPoints: [DummyData.ChartPoint]
    let progressList: [UserProgress] // order determines color; displayName for legend

    private static let colors: [Color] = [
        Color(red: 0.545, green: 0.271, blue: 0.075),   // brown
        Color(red: 0.020, green: 0.588, blue: 0.412),  // green
        Color(red: 0.008, green: 0.518, blue: 0.784),  // blue
        Color(red: 0.486, green: 0.227, blue: 0.929),  // purple
        Color(red: 0.863, green: 0.149, blue: 0.149),  // red
        Color(red: 0.918, green: 0.345, blue: 0.043), // orange
        Color(red: 0.035, green: 0.569, blue: 0.698),  // cyan
        Color(red: 0.745, green: 0.102, blue: 0.365),  // pink
    ]

    private var dateLabels: [String] {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.timeZone = TimeZone.current
        var out: [String] = []
        for pt in chartPoints {
            guard let d = formatter.date(from: pt.date) else { continue }
            formatter.dateFormat = "MMM d"
            out.append(formatter.string(from: d))
        }
        return out
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Progress Over The Week")
                .font(.headline)
                .foregroundStyle(.primary)
            if progressList.isEmpty || chartPoints.isEmpty {
                Text("No progress data available")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 24)
            } else {
                chartView
                legendView
            }
        }
        .modifier(GlassCardStyle())
    }

    private var chartView: some View {
        GeometryReader { geo in
            ChartContentView(
                width: geo.size.width,
                chartPoints: chartPoints,
                progressList: progressList,
                dateLabels: dateLabels,
                colors: Self.colors
            )
        }
        .frame(height: 220)
    }

    private var legendView: some View {
        LazyVGrid(columns: [GridItem(.adaptive(minimum: 80), alignment: .leading)], alignment: .leading, spacing: 6) {
            ForEach(Array(progressList.enumerated()), id: \.element.userId) { index, progress in
                HStack(spacing: 6) {
                    Circle()
                        .fill(Self.colors[index % Self.colors.count])
                        .frame(width: 10, height: 10)
                    Text(progress.displayName)
                        .font(.caption)
                        .foregroundStyle(.primary)
                        .lineLimit(1)
                }
            }
        }
    }
}

// MARK: - Chart content (layout and paths live here so ViewBuilder doesn't see declarations)
private struct ChartContentView: View {
    let width: CGFloat
    let chartPoints: [DummyData.ChartPoint]
    let progressList: [UserProgress]
    let dateLabels: [String]
    let colors: [Color]

    private let h: CGFloat = 200
    private let paddingLeft: CGFloat = 44
    private let paddingRight: CGFloat = 8
    private let paddingTop: CGFloat = 8
    private let paddingBottom: CGFloat = 32
    private var chartW: CGFloat { width - paddingLeft - paddingRight }
    private var chartH: CGFloat { h - paddingTop - paddingBottom }
    private var n: Int { max(chartPoints.count - 1, 1) }

    private func xIndex(_ i: Int) -> CGFloat {
        paddingLeft + (CGFloat(i) / CGFloat(n)) * chartW
    }

    private func yPercent(_ pct: Double) -> CGFloat {
        paddingTop + chartH - (CGFloat(pct) / 100) * chartH
    }

    private func linePath(userId: String) -> Path {
        var path = Path()
        guard !chartPoints.isEmpty else { return path }
        for (i, pt) in chartPoints.enumerated() {
            let pct = pt.progressByUser[userId] ?? 0
            let x = xIndex(i)
            let y = yPercent(pct)
            if i == 0 { path.move(to: CGPoint(x: x, y: y)) }
            else { path.addLine(to: CGPoint(x: x, y: y)) }
        }
        return path
    }

    var body: some View {
        ZStack(alignment: .topLeading) {
            ForEach([0, 25, 50, 75, 100], id: \.self) { pct in
                Path { path in
                    let y = yPercent(Double(pct))
                    path.move(to: CGPoint(x: paddingLeft, y: y))
                    path.addLine(to: CGPoint(x: width - paddingRight, y: y))
                }
                .stroke(Color.gray.opacity(0.25), lineWidth: 1)
            }
            ForEach(Array(progressList.enumerated()), id: \.element.userId) { index, progress in
                linePath(userId: progress.userId)
                    .stroke(colors[index % colors.count], style: StrokeStyle(lineWidth: 4, lineCap: .round, lineJoin: .round))
            }
            ForEach(Array(chartPoints.indices), id: \.self) { i in
                Text(i < dateLabels.count ? dateLabels[i] : "")
                    .font(.system(size: 9))
                    .foregroundStyle(.secondary)
                    .position(x: xIndex(i), y: h - 10)
            }
            ForEach([0, 25, 50, 75, 100], id: \.self) { pct in
                Text("\(pct)%")
                    .font(.system(size: 9))
                    .foregroundStyle(.secondary)
                    .position(x: paddingLeft - 18, y: yPercent(Double(pct)) + 4)
            }
        }
    }
}
