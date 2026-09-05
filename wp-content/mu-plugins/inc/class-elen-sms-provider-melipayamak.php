<?php
/**
 * Melipayamak SMS provider (REST API, pattern-free simple send).
 * Docs: https://www.melipayamak.com/api/
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class ELEN_SMS_Provider_Melipayamak implements ELEN_SMS_Provider {

	public function send( $to, $message ) {
		$username = defined( 'ELEN_MELIPAYAMAK_USERNAME' ) ? ELEN_MELIPAYAMAK_USERNAME : get_option( 'elen_melipayamak_username' );
		$password = defined( 'ELEN_MELIPAYAMAK_PASSWORD' ) ? ELEN_MELIPAYAMAK_PASSWORD : get_option( 'elen_melipayamak_password' );
		$from     = defined( 'ELEN_MELIPAYAMAK_FROM' ) ? ELEN_MELIPAYAMAK_FROM : get_option( 'elen_melipayamak_from' );

		if ( ! $username || ! $password || ! $from ) {
			return new WP_Error( 'sms_not_configured', __( 'Melipayamak credentials are not configured.', 'elen-coffee' ) );
		}

		$response = wp_remote_post(
			'https://rest.payamak-panel.com/api/SendSMS/SendSMS',
			array(
				'timeout' => 10,
				'headers' => array( 'Content-Type' => 'application/json' ),
				'body'    => wp_json_encode(
					array(
						'username' => $username,
						'password' => $password,
						'to'       => $to,
						'from'     => $from,
						'text'     => $message,
						'isflash'  => false,
					)
				),
			)
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$code = wp_remote_retrieve_response_code( $response );
		if ( $code < 200 || $code >= 300 ) {
			return new WP_Error( 'sms_send_failed', sprintf( 'Melipayamak returned HTTP %d', $code ) );
		}

		return true;
	}
}
