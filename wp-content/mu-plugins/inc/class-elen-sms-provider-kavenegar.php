<?php
/**
 * Kavenegar SMS provider. API key is read from an environment
 * constant/option, never hardcoded, never sent to the browser.
 * Docs: https://kavenegar.com/rest.html
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class ELEN_SMS_Provider_Kavenegar implements ELEN_SMS_Provider {

	public function send( $to, $message ) {
		$api_key = defined( 'ELEN_KAVENEGAR_API_KEY' ) ? ELEN_KAVENEGAR_API_KEY : get_option( 'elen_kavenegar_api_key' );
		if ( ! $api_key ) {
			return new WP_Error( 'sms_not_configured', __( 'Kavenegar API key is not configured.', 'elen-coffee' ) );
		}

		$url = sprintf( 'https://api.kavenegar.com/v1/%s/sms/send.json', rawurlencode( $api_key ) );

		$response = wp_remote_post(
			$url,
			array(
				'timeout' => 10,
				'body'    => array(
					'receptor' => $to,
					'message'  => $message,
				),
			)
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$code = wp_remote_retrieve_response_code( $response );
		if ( $code < 200 || $code >= 300 ) {
			return new WP_Error( 'sms_send_failed', sprintf( 'Kavenegar returned HTTP %d', $code ) );
		}

		return true;
	}
}
