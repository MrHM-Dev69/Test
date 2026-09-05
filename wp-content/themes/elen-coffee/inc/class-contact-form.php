<?php
/**
 * Contact form: nonce-protected, sanitized, honeypot + timing anti-spam,
 * server-side validated. No external form plugin needed for four fields.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class ELEN_Contact_Form {

	public static function init() {
		add_action( 'admin_post_elen_contact_submit', array( __CLASS__, 'handle_submit' ) );
		add_action( 'admin_post_nopriv_elen_contact_submit', array( __CLASS__, 'handle_submit' ) );
		add_action( 'admin_post_elen_newsletter_subscribe', array( __CLASS__, 'handle_newsletter' ) );
		add_action( 'admin_post_nopriv_elen_newsletter_subscribe', array( __CLASS__, 'handle_newsletter' ) );
	}

	/**
	 * Stores the email as a pending contact (no bundled mailing-list
	 * plugin/service). Swap the do_action below for your ESP's API call
	 * (Mailchimp, Klaviyo, etc.) — kept as an extension point rather than
	 * pulling in another dependency for a feature with no chosen provider.
	 */
	public static function handle_newsletter() {
		$redirect = wp_get_referer() ?: home_url( '/' );

		if ( ! isset( $_POST['elen_newsletter_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['elen_newsletter_nonce'] ) ), 'elen_newsletter' ) ) {
			wp_safe_redirect( add_query_arg( 'elen_newsletter', 'invalid', $redirect ) );
			exit;
		}

		$email = isset( $_POST['email'] ) ? sanitize_email( wp_unslash( $_POST['email'] ) ) : '';
		if ( '' === $email || ! is_email( $email ) ) {
			wp_safe_redirect( add_query_arg( 'elen_newsletter', 'invalid', $redirect ) );
			exit;
		}

		/**
		 * Fires with a validated, sanitized subscriber email.
		 *
		 * @param string $email
		 */
		do_action( 'elen_newsletter_subscribed', $email );

		wp_safe_redirect( add_query_arg( 'elen_newsletter', 'success', $redirect ) );
		exit;
	}

	public static function handle_submit() {
		if ( ! isset( $_POST['elen_contact_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['elen_contact_nonce'] ) ), 'elen_contact_submit' ) ) {
			wp_safe_redirect( add_query_arg( 'elen_contact', 'invalid', wp_get_referer() ?: home_url( '/' ) ) );
			exit;
		}

		// Honeypot: real users never fill this hidden field.
		if ( ! empty( $_POST['website'] ) ) {
			wp_safe_redirect( add_query_arg( 'elen_contact', 'success', wp_get_referer() ?: home_url( '/' ) ) );
			exit;
		}

		// Time trap: reject submissions faster than a human can plausibly type.
		$loaded_at = isset( $_POST['elen_form_loaded'] ) ? (int) $_POST['elen_form_loaded'] : 0;
		if ( $loaded_at && ( time() - $loaded_at ) < 3 ) {
			wp_safe_redirect( add_query_arg( 'elen_contact', 'invalid', wp_get_referer() ?: home_url( '/' ) ) );
			exit;
		}

		$name    = isset( $_POST['name'] ) ? sanitize_text_field( wp_unslash( $_POST['name'] ) ) : '';
		$email   = isset( $_POST['email'] ) ? sanitize_email( wp_unslash( $_POST['email'] ) ) : '';
		$subject = isset( $_POST['subject'] ) ? sanitize_text_field( wp_unslash( $_POST['subject'] ) ) : '';
		$message = isset( $_POST['message'] ) ? sanitize_textarea_field( wp_unslash( $_POST['message'] ) ) : '';

		$errors = array();
		if ( '' === $name ) {
			$errors[] = 'name';
		}
		if ( '' === $email || ! is_email( $email ) ) {
			$errors[] = 'email';
		}
		if ( '' === $message || mb_strlen( $message ) < 10 ) {
			$errors[] = 'message';
		}

		// Simple IP-based rate limit: max 5 submissions / 10 minutes.
		$ip  = isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : 'unknown';
		$key = 'elen_contact_rate_' . md5( $ip );
		$count = (int) get_transient( $key );
		if ( $count >= 5 ) {
			$errors[] = 'rate_limited';
		}

		if ( ! empty( $errors ) ) {
			$redirect = add_query_arg(
				array(
					'elen_contact' => 'invalid',
					'elen_fields'  => implode( ',', $errors ),
				),
				wp_get_referer() ?: home_url( '/contact/' )
			);
			wp_safe_redirect( $redirect );
			exit;
		}

		set_transient( $key, $count + 1, 10 * MINUTE_IN_SECONDS );

		$to      = get_option( 'admin_email' );
		$subject = sprintf( '[%s] %s', get_bloginfo( 'name' ), $subject ?: __( 'New contact form message', 'elen-coffee' ) );
		$body    = sprintf(
			"%s\n\n%s: %s\n%s: %s\n\n%s",
			__( 'New message via the contact form.', 'elen-coffee' ),
			__( 'Name', 'elen-coffee' ),
			$name,
			__( 'Email', 'elen-coffee' ),
			$email,
			$message
		);
		$headers = array( 'Reply-To: ' . $name . ' <' . $email . '>' );

		wp_mail( $to, $subject, $body, $headers );

		wp_safe_redirect( add_query_arg( 'elen_contact', 'success', wp_get_referer() ?: home_url( '/contact/' ) ) );
		exit;
	}
}

ELEN_Contact_Form::init();
