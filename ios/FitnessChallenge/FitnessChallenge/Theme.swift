//
//  Theme.swift
//  FitnessChallenge
//
//  Colors and styling to match web app.
//

import SwiftUI

enum Theme {
    static let brown = Color(red: 0.545, green: 0.271, blue: 0.075)   // #8B4513
    static let brownDark = Color(red: 0.420, green: 0.267, blue: 0.137) // #6B4423
    /// Warm off-white like web glass-card (#fefefe)
    static let cardBackground = Color(red: 0.996, green: 0.996, blue: 0.996)
    static let redPunishment = Color(red: 1, green: 0.9, blue: 0.9)
    static let greenProgress = Color(red: 0.025, green: 0.373, blue: 0.275) // #065f46
    static let strengthBlue = Color(red: 0.008, green: 0.518, blue: 0.784)   // ~blue-400

}

/// Paper-weight card style with subtle grid and 3D lift.
struct GlassCardStyle: ViewModifier {
    func body(content: Content) -> some View {
        content
            .padding()
            .background(
                ZStack {
                    Theme.cardBackground
                    GridPatternView()
                }
            )
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(Theme.brown.opacity(0.08), lineWidth: 1)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(
                        LinearGradient(
                            colors: [Color.white.opacity(0.5), Color.white.opacity(0.0)],
                            startPoint: .top,
                            endPoint: .center
                        ),
                        lineWidth: 1
                    )
            )
            .shadow(color: Theme.brown.opacity(0.08), radius: 2, x: 0, y: 1)
            .shadow(color: Theme.brown.opacity(0.14), radius: 8, x: 0, y: 4)
            .shadow(color: Theme.brown.opacity(0.1), radius: 20, x: 0, y: 10)
    }
}

/// Subtle grid overlay matching web (brown 2% lines every 12pt).
private struct GridPatternView: View {
    var body: some View {
        GeometryReader { geo in
            let step: CGFloat = 12
            Path { path in
                var x: CGFloat = 0
                while x <= geo.size.width {
                    path.move(to: CGPoint(x: x, y: 0))
                    path.addLine(to: CGPoint(x: x, y: geo.size.height))
                    x += step
                }
                var y: CGFloat = 0
                while y <= geo.size.height {
                    path.move(to: CGPoint(x: 0, y: y))
                    path.addLine(to: CGPoint(x: geo.size.width, y: y))
                    y += step
                }
            }
            .stroke(Theme.brown.opacity(0.02), lineWidth: 1)
        }
    }
}
