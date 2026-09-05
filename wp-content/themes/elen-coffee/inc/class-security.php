<?php
/**
 * Theme-level security hardening. Host/server-level items (HTTPS
 * enforcement, DISALLOW_FILE_EDIT, DB credentials, backups) belong in
 * wp-config.php / hosting and are documented in README.md — a theme
 * cannot and should not set those.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class ELEN_Security {

	public static function init() {
		// Reduce information disclosure.
		remove_action( 'wp_head', 'wp_generator' );
		add_filter( 'the_generator', '__return_empty_string' );
		add_filter( 'style_loader_src', array( __CLASS__, 'strip_version_query' ), 9999 );
		add_filter( 'script_loader_src', array( __CLASS__, 'strip_version_query' ), 9999 );

		// Disable XML-RPC (not used; a common brute-force/amplification vector).
		add_filter( 'xmlrpc_enabled', '__return_false' );
		add_filter( 'wp_headers', array( __CLASS__, 'remove_xmlrpc_header' ) );

		// Disable user enumeration via ?author=N.
		add_action( 'template_redirect', array( __CLASS__, 'block_author_enum' ) );

		// Security response headers.
		add_action( 'send_headers', array( __CLASS__, 'security_headers' ) );

		// Login hardening: generic error messages, basic rate limiting.
		add_filter( 'login_errors', array( __CLASS__, 'generic_login_error' ) );
		add_filter( 'authenticate', array( __CLASS__, 'rate_limit_login' ), 30, 3 );
		add_action( 'wp_login_failed', array( __CLASS__, 'record_failed_login' ) );
		add_action( 'wp_login', array( __CLASS__, 'clear_failed_logins' ), 10, 2 );

		// REST API: keep it available for the block editor / WooCommerce
		// store API, but stop it from leaking a user list to anonymous callers.
		add_filter( 'rest_endpoints', array( __CLASS__, 'restrict_users_endpoint' ) );

		// Disallow SVG/executable uploads beyond WordPress' own allow-list;
		// never widen it.
		add_filter( 'upload_mimes', array( __CLASS__, 'restrict_mimes' ) );
	}

	public static function strip_version_query( $src ) {
		if ( strpos( $src, 'ver=' . get_bloginfo( 'version' ) ) !== false ) {
			$src = remove_query_arg( 'ver', $src );
		}
		return $src;
	}

	public static function remove_xmlrpc_header( $headers ) {
		unset( $headers['X-Pingback'] );
		return $headers;
	}

	public static function block_author_enum() {
		if ( is_admin() ) {
			return;
		}
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only redirect guard.
		if ( isset( $_GET['author'] ) && ! is_user_logged_in() ) {
			wp_safe_redirect( home_url( '/' ), 301 );
			exit;
		}
	}

	public static function security_headers() {
		if ( headers_sent() ) {
			return;
		}
		header( 'X-Content-Type-Options: nosniff' );
		header( 'X-Frame-Options: SAMEORIGIN' );
		header( 'Referrer-Policy: strict-origin-when-cross-origin' );
		header( 'Permissions-Policy: geolocation=(), camera=(), microphone=(), payment=(self)' );
		if ( is_ssl() ) {
			header( 'Strict-Transport-Security: max-age=31536000; includeSubDomains' );
		}
		// CSP is intentionally not sent from the theme: the final policy
		// depends on which payment gateway/SDK and analytics scripts are
		// active on a given install, and a wrong CSP can silently break
		// checkout. Set it at the server/CDN level once those are known —
		// see README.md "Security" section for the recommended baseline.
	}

	public static function generic_login_error() {
		return __( 'Invalid credentials.', 'elen-coffee' );
	}

	private static function login_throttle_key( $username ) {
		$ip = isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : 'unknown';
		return 'elen_login_fail_' . md5( $ip . '|' . strtolower( $username ) );
	}

	public static function rate_limit_login( $user, $username, $password ) {
		if ( empty( $username ) ) {
			return $user;
		}
		$key      = self::login_throttle_key( $username );
		$attempts = (int) get_transient( $key );
		if ( $attempts >= 5 ) {
			return new WP_Error( 'too_many_attempts', __( 'Too many login attempts. Please try again in a few minutes.', 'elen-coffee' ) );
		}
		return $user;
	}

	public static function record_failed_login( $username ) {
		$key      = self::login_throttle_key( $username );
		$attempts = (int) get_transient( $key );
		set_transient( $key, $attempts + 1, 10 * MINUTE_IN_SECONDS );
	}

	public static function clear_failed_logins( $username, $user ) {
		delete_transient( self::login_throttle_key( $username ) );
	}

	public static function restrict_users_endpoint( $endpoints ) {
		if ( isset( $endpoints['/wp/v2/users'] ) && ! is_user_logged_in() ) {
			unset( $endpoints['/wp/v2/users'] );
		}
		if ( isset( $endpoints['/wp/v2/users/(?P<id>[\d]+)'] ) && ! is_user_logged_in() ) {
			unset( $endpoints['/wp/v2/users/(?P<id>[\d]+)'] );
		}
		return $endpoints;
	}

	public static function restrict_mimes( $mimes ) {
		unset( $mimes['svg'], $mimes['swf'] );
		return $mimes;
	}
}

ELEN_Security::init();
