<?php
/**
 * Zibal direct REST integration.
 * Docs: https://help.zibal.ir/IPG/API/
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class ELEN_Gateway_Zibal extends ELEN_Gateway_Base {

	public function __construct() {
		$this->id                 = 'elen_zibal';
		$this->icon               = '';
		$this->method_title       = __( 'Zibal', 'elen-coffee' );
		$this->method_description = __( 'Redirects the customer to Zibal to complete payment.', 'elen-coffee' );

		parent::__construct();
	}

	private function api_base() {
		return 'https://gateway.zibal.ir/v1';
	}

	private function startpay_base() {
		return 'https://gateway.zibal.ir/start/';
	}

	protected function request_payment( WC_Order $order ) {
		$merchant = $this->is_sandbox() ? 'zibal' : $this->merchant_id();

		$response = wp_remote_post(
			$this->api_base() . '/request',
			array(
				'timeout' => 15,
				'headers' => array( 'Content-Type' => 'application/json' ),
				'body'    => wp_json_encode(
					array(
						'merchant'    => $merchant,
						'amount'      => (int) round( $order->get_total() ) * 10, // Toman → Rial.
						'callbackUrl' => add_query_arg( 'order_id', $order->get_id(), $this->callback_url() ),
						'description' => sprintf( 'Order #%d — %s', $order->get_id(), get_bloginfo( 'name' ) ),
						'mobile'      => $order->get_billing_phone(),
					)
				),
			)
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$body   = json_decode( wp_remote_retrieve_body( $response ), true );
		$result = isset( $body['result'] ) ? (int) $body['result'] : 0;

		if ( 100 !== $result || empty( $body['trackId'] ) ) {
			return new WP_Error( 'zibal_request_failed', $body['message'] ?? __( 'Zibal did not return a valid track ID.', 'elen-coffee' ) );
		}

		$order->update_meta_data( self::META_TXN_ID, sanitize_text_field( (string) $body['trackId'] ) );
		$order->save();

		return $this->startpay_base() . rawurlencode( (string) $body['trackId'] );
	}

	protected function verify_payment( WC_Order $order ) {
		$track_id = $order->get_meta( self::META_TXN_ID );
		$merchant = $this->is_sandbox() ? 'zibal' : $this->merchant_id();

		if ( ! $track_id ) {
			return new WP_Error( 'zibal_no_track_id', __( 'Missing track ID for this order.', 'elen-coffee' ) );
		}

		$response = wp_remote_post(
			$this->api_base() . '/verify',
			array(
				'timeout' => 15,
				'headers' => array( 'Content-Type' => 'application/json' ),
				'body'    => wp_json_encode(
					array(
						'merchant' => $merchant,
						'trackId'  => $track_id,
					)
				),
			)
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$body   = json_decode( wp_remote_retrieve_body( $response ), true );
		$result = isset( $body['result'] ) ? (int) $body['result'] : 0;

		// 100 = verified now, 201 = already verified (idempotent success).
		if ( ! in_array( $result, array( 100, 201 ), true ) ) {
			return new WP_Error( 'zibal_verify_failed', $body['message'] ?? __( 'Zibal payment verification failed.', 'elen-coffee' ) );
		}

		return true;
	}
}
