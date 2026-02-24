//
//  ProgressOverTimeChartView.swift
//  FitnessChallenge
//
//  Line chart: cumulative progress over the week, one line per participant, legend below.
//  X-axis: full week (start midnight to end 23:59). Data lines stop at current time.
//  Data reflects progress at exact timestamp; axis labels show days only.
//

import SwiftUI

struct ProgressOverTimeChartView: View {
    let chartPoints: [ProgressCalculations.ChartPoint]
    let progressList: [UserProgress] // order determines color; displayName for legend
    let weekStartDate: String
    let weekEndDate: String

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

    /// Day labels for x-axis: one per day (e.g. "Mon", "Tue").
    private var dayLabels: [(label: String, xFraction: CGFloat)] {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.timeZone = TimeZone.current
        let dayLabelFormatter = DateFormatter()
        dayLabelFormatter.dateFormat = "EEE"
        dayLabelFormatter.timeZone = TimeZone.current
        let cal = Calendar.current
        let startStr = String(weekStartDate.prefix(10))
        let endStr = String(weekEndDate.prefix(10))
        guard let start = formatter.date(from: startStr), let end = formatter.date(from: endStr) else { return [] }
        let totalDays = max(1, cal.dateComponents([.day], from: start, to: end).day ?? 0) + 1
        var out: [(String, CGFloat)] = []
        var current = start
        var i = 0
        while current <= end {
            let frac = totalDays > 1 ? CGFloat(i) / CGFloat(totalDays - 1) : 0.5
            out.append((dayLabelFormatter.string(from: current), frac))
            current = cal.date(byAdding: .day, value: 1, to: current) ?? current
            i += 1
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
                weekStartDate: weekStartDate,
                weekEndDate: weekEndDate,
                dayLabels: dayLabels,
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
    let chartPoints: [ProgressCalculations.ChartPoint]
    let progressList: [UserProgress]
    let weekStartDate: String
    let weekEndDate: String
    let dayLabels: [(label: String, xFraction: CGFloat)]
    let colors: [Color]

    private let h: CGFloat = 200
    private let paddingLeft: CGFloat = 44
    private let paddingRight: CGFloat = 8
    private let paddingTop: CGFloat = 8
    private let paddingBottom: CGFloat = 32
    private var chartW: CGFloat { width - paddingLeft - paddingRight }
    private var chartH: CGFloat { h - paddingTop - paddingBottom }

    private var weekStart: Date? {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.timeZone = TimeZone.current
        guard let d = f.date(from: String(weekStartDate.prefix(10))) else { return nil }
        return Calendar.current.startOfDay(for: d)
    }

    private var weekEnd: Date? {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.timeZone = TimeZone.current
        let cal = Calendar.current
        guard let d = f.date(from: String(weekEndDate.prefix(10))) else { return nil }
        return cal.date(bySettingHour: 23, minute: 59, second: 59, of: d)
    }

    private func xForTimestamp(_ ts: String) -> CGFloat? {
        guard let start = weekStart, let end = weekEnd else { return nil }
        let iso = ISO8601DateFormatter()
        iso.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        var date = iso.date(from: ts)
        if date == nil {
            iso.formatOptions = [.withInternetDateTime]
            date = iso.date(from: ts)
        }
        if date == nil {
            let f = DateFormatter()
            f.dateFormat = "yyyy-MM-dd'T'HH:mm:ss"
            f.timeZone = TimeZone(identifier: "UTC")
            date = f.date(from: String(ts.prefix(19)))
        }
        if date == nil {
            let f = DateFormatter()
            f.dateFormat = "yyyy-MM-dd"
            date = f.date(from: String(ts.prefix(10)))
        }
        guard let t = date else { return nil }
        let range = end.timeIntervalSince(start)
        guard range > 0 else { return paddingLeft }
        let frac = t.timeIntervalSince(start) / range
        return paddingLeft + CGFloat(min(max(frac, 0), 1)) * chartW
    }

    private func yPercent(_ pct: Double) -> CGFloat {
        paddingTop + chartH - (CGFloat(pct) / 100) * chartH
    }

    private func linePath(userId: String) -> Path {
        var path = Path()
        guard !chartPoints.isEmpty else { return path }
        for (i, pt) in chartPoints.enumerated() {
            guard let x = xForTimestamp(pt.timestamp) else { continue }
            let pct = pt.progressByUser[userId] ?? 0
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
            ForEach(Array(progressList.enumerated()), id: \.element.userId) { index, progress in
                if let last = chartPoints.last,
                   let x = xForTimestamp(last.timestamp) {
                    let pct = last.progressByUser[progress.userId] ?? 0
                    let y = yPercent(pct)
                    Circle()
                        .fill(colors[index % colors.count])
                        .frame(width: 8, height: 8)
                        .position(x: x, y: y)
                }
            }
            ForEach(Array(dayLabels.enumerated()), id: \.offset) { _, item in
                Text(item.label)
                    .font(.system(size: 9))
                    .foregroundStyle(.secondary)
                    .position(x: paddingLeft + item.xFraction * chartW, y: h - 10)
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
