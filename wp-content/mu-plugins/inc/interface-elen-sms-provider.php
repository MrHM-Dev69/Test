<?php
/**
 * Contract every SMS provider must implement. Adding a new Iranian SMS
 * service is: implement this interface, register it in
 * ELEN_SMS_Manager::provider(), done — no changes anywhere else.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

interface ELEN_SMS_Provider {

	/**
	 * @param string $to      E.164 or local mobile number.
	 * @param string $message Plain-text message body.
	 * @return true|WP_Error
	 */
	public function send( $to, $message );
}
