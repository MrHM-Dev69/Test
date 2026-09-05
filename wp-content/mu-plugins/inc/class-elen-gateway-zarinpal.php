<?php
/**
 * ZarinPal direct REST integration (Payment Request v4 / IPG).
 * Docs: https://docs.zarinpal.com/paymentGateway/
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class ELEN_Gateway_ZarinPal extends ELEN_Gateway_Base {

	public function __construct() {
		$this->id                 = 'elen_zarinpal';
		$this->icon               = '';
		$this->method_title       = __( 'ZarinPal', 'elen-coffee' );
		$this->method_description = __( 'Redirects the customer to ZarinPal to complete payment.', 'elen-coffee' );

		parent::__construct();
	}

	private function api_base() {
		return $this->is_sandbox() ? 'https://sandbox.zarinpal.com/pg/v4/payment' : 'https://api.zarinpal.com/pg/v4/payment';
	}

	private function startpay_base() {
		return $this->is_sandbox() ? 'https://sandbox.zarinpal.com/pg/StartPay/' : 'https://www.zarinpal.com/pg/StartPay/';
	}

	protected function request_payment( WC_Order $order ) {
		$response = wp_remote_post(
			$this->api_base() . '/request.json',
			array(
				'timeout' => 15,
				'headers' => array( 'Content-Type' => 'application/json', 'Accept' => 'application/json' ),
				'body'    => wp_json_encode(
					array(
						'merchant_id'  => $this->merchant_id(),
						'amount'       => (int) round( $order->get_total() ) * 10, // Toman → Rial.
						'callback_url' => add_query_arg( 'order_id', $order->get_id(), $this->callback_url() ),
						'description'  => sprintf( 'Order #%d — %s', $order->get_id(), get_bloginfo( 'name' ) ),
						'metadata'     => array( 'email' => $order->get_billing_email(), 'mobile' => $order->get_billing_phone() ),
					)
				),
			)
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$body = json_decode( wp_remote_retrieve_body( $response ), true );
		$code = isset( $body['data']['code'] ) ? (int) $body['data']['code'] : 0;

		if ( 100 !== $code || empty( $body['data']['authority'] ) ) {
			$message = $body['errors']['message'] ?? __( 'ZarinPal did not return a valid payment authority.', 'elen-coffee' );
			return new WP_Error( 'zarinpal_request_failed', $message );
		}

		$order->update_meta_data( self::META_TXN_ID, sanitize_text_field( $body['data']['authority'] ) );
		$order->save();

		return $this->startpay_base() . rawurlencode( $body['data']['authority'] );
	}

	protected function verify_payment( WC_Order $order ) {
		$authority = $order->get_meta( self::META_TXN_ID );
		if ( ! $authority ) {
			return new WP_Error( 'zarinpal_no_authority', __( 'Missing payment authority for this order.', 'elen-coffee' ) );
		}

		$response = wp_remote_post(
			$this->api_base() . '/verify.json',
			array(
				'timeout' => 15,
				'headers' => array( 'Content-Type' => 'application/json', 'Accept' => 'application/json' ),
				'body'    => wp_json_encode(
					array(
						'merchant_id' => $this->merchant_id(),
						'amount'      => (int) round( $order->get_total() ) * 10,
						'authority'   => $authority,
					)
				),
			)
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$body = json_decode( wp_remote_retrieve_body( $response ), true );
		$code = isset( $body['data']['code'] ) ? (int) $body['data']['code'] : 0;

		// 100 = verified now, 101 = already verified (still a success — idempotent).
		if ( ! in_array( $code, array( 100, 101 ), true ) ) {
			$message = $body['errors']['message'] ?? __( 'ZarinPal payment verification failed.', 'elen-coffee' );
			return new WP_Error( 'zarinpal_verify_failed', $message );
		}

		if ( ! empty( $body['data']['ref_id'] ) ) {
			$order->update_meta_data( self::META_TXN_ID, sanitize_text_field( $body['data']['ref_id'] ) );
		}

		return true;
	}
}
