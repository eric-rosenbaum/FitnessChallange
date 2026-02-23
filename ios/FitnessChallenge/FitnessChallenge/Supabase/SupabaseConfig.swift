//
//  SupabaseConfig.swift
//  FitnessChallenge
//
//  Loads Supabase URL and anon key from Supabase-Config.plist (or Info.plist).
//  Add Supabase-Config.plist with keys SUPABASE_URL and SUPABASE_ANON_KEY.
//

import Foundation

enum SupabaseConfig {
    static var url: URL? {
        guard let s = string(for: "SUPABASE_URL"), !s.isEmpty else { return nil }
        return URL(string: s)
    }

    static var anonKey: String? {
        string(for: "SUPABASE_ANON_KEY")
    }

    /// Returns true when both URL and anon key are set (so we can use real backend).
    static var isConfigured: Bool {
        url != nil && (anonKey?.isEmpty == false)
    }

    private static func string(for key: String) -> String? {
        // 1) Supabase-Config.plist in main bundle
        if let path = Bundle.main.path(forResource: "Supabase-Config", ofType: "plist"),
           let dict = NSDictionary(contentsOfFile: path) as? [String: Any],
           let value = dict[key] as? String, !value.isEmpty {
            return value
        }
        // 2) Info.plist (e.g. custom keys in target)
        if let value = Bundle.main.object(forInfoDictionaryKey: key) as? String, !value.isEmpty {
            return value
        }
        return nil
    }
}
