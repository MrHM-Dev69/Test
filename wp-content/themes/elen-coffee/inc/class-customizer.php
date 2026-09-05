<?php
/**
 * Customizer fields for the content an admin needs to change without a
 * developer: hero copy/image, brand story, philosophy, contact details,
 * and social links. Structural layout stays fixed by design intent — this
 * exposes the words and images, not the sections themselves.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class ELEN_Customizer {

	public static function init() {
		add_action( 'customize_register', array( __CLASS__, 'register' ) );
		add_filter( 'elen_social_links', array( __CLASS__, 'social_links' ) );
	}

	public static function register( $wp_customize ) {
		$wp_customize->add_panel( 'elen_content', array(
			'title'    => __( 'ELEN Site Content', 'elen-coffee' ),
			'priority' => 30,
		) );

		self::section_home( $wp_customize );
		self::section_about( $wp_customize );
		self::section_contact( $wp_customize );
		self::section_social( $wp_customize );
	}

	private static function text_setting( $wp_customize, $section, $id, $label, $default = '', $control = 'text' ) {
		$wp_customize->add_setting( $id, array(
			'default'           => $default,
			'sanitize_callback' => 'textarea' === $control ? 'sanitize_textarea_field' : 'sanitize_text_field',
		) );
		$args = array( 'label' => $label, 'section' => $section );
		if ( 'textarea' === $control ) {
			$args['type'] = 'textarea';
		}
		$wp_customize->add_control( $id, $args );
	}

	private static function image_setting( $wp_customize, $section, $id, $label ) {
		$wp_customize->add_setting( $id, array( 'sanitize_callback' => 'esc_url_raw' ) );
		$wp_customize->add_control( new WP_Customize_Image_Control( $wp_customize, $id, array(
			'label'   => $label,
			'section' => $section,
		) ) );
	}

	private static function section_home( $wp_customize ) {
		$wp_customize->add_section( 'elen_home', array(
			'title' => __( 'Home — Hero & Story', 'elen-coffee' ),
			'panel' => 'elen_content',
		) );

		self::text_setting( $wp_customize, 'elen_home', 'elen_hero_eyebrow', __( 'Hero eyebrow', 'elen-coffee' ), __( 'Specialty Coffee, Roasted with Intent', 'elen-coffee' ) );
		self::text_setting( $wp_customize, 'elen_home', 'elen_hero_heading', __( 'Hero heading', 'elen-coffee' ), __( 'Coffee, slowed down.', 'elen-coffee' ) );
		self::text_setting( $wp_customize, 'elen_home', 'elen_hero_subheading', __( 'Hero subheading', 'elen-coffee' ), __( 'Single-origin beans, small-batch roasted in-house, and shipped within days of roasting — never months.', 'elen-coffee' ), 'textarea' );
		self::text_setting( $wp_customize, 'elen_home', 'elen_hero_cta_text', __( 'Hero button text', 'elen-coffee' ), __( 'Shop the collection', 'elen-coffee' ) );
		self::image_setting( $wp_customize, 'elen_home', 'elen_hero_image', __( 'Hero image', 'elen-coffee' ) );

		self::text_setting( $wp_customize, 'elen_home', 'elen_story_heading', __( 'Brand story heading', 'elen-coffee' ), __( 'Roasted in small batches, for people who taste the difference.', 'elen-coffee' ) );
		self::text_setting( $wp_customize, 'elen_home', 'elen_story_text', __( 'Brand story text', 'elen-coffee' ), __( 'ELEN began with a simple frustration: most coffee sold in supermarkets is roasted months before it reaches a cup. We roast in small batches, every week, and ship within 72 hours — so what you brew still tastes like where it came from.', 'elen-coffee' ), 'textarea' );
		self::image_setting( $wp_customize, 'elen_home', 'elen_story_image', __( 'Brand story image', 'elen-coffee' ) );

		self::text_setting( $wp_customize, 'elen_home', 'elen_philosophy_heading', __( 'Philosophy heading', 'elen-coffee' ), __( 'Origin, roast, and honesty.', 'elen-coffee' ) );
		self::text_setting( $wp_customize, 'elen_home', 'elen_philosophy_text', __( 'Philosophy text', 'elen-coffee' ), __( 'We work directly with importers who pay above fair-trade minimums, roast to highlight — not mask — each origin, and print roast dates on every bag.', 'elen-coffee' ), 'textarea' );
	}

	private static function section_about( $wp_customize ) {
		$wp_customize->add_section( 'elen_about', array(
			'title' => __( 'About Page', 'elen-coffee' ),
			'panel' => 'elen_content',
		) );

		self::text_setting( $wp_customize, 'elen_about', 'elen_about_heading', __( 'About heading', 'elen-coffee' ), __( 'A roastery built on patience.', 'elen-coffee' ) );
		self::text_setting( $wp_customize, 'elen_about', 'elen_about_intro', __( 'About intro', 'elen-coffee' ), __( "ELEN is a specialty coffee roastery. We buy in small lots, roast on a schedule, and sell what's fresh — nothing more.", 'elen-coffee' ), 'textarea' );
		self::image_setting( $wp_customize, 'elen_about', 'elen_about_image', __( 'About hero image', 'elen-coffee' ) );
	}

	private static function section_contact( $wp_customize ) {
		$wp_customize->add_section( 'elen_contact', array(
			'title' => __( 'Contact Details', 'elen-coffee' ),
			'panel' => 'elen_content',
		) );

		self::text_setting( $wp_customize, 'elen_contact', 'elen_contact_phone', __( 'Phone', 'elen-coffee' ), '+98 21 0000 0000' );
		self::text_setting( $wp_customize, 'elen_contact', 'elen_contact_email', __( 'Email', 'elen-coffee' ), 'hello@elencoffee.com' );
		self::text_setting( $wp_customize, 'elen_contact', 'elen_contact_address', __( 'Address', 'elen-coffee' ), '', 'textarea' );
		self::text_setting( $wp_customize, 'elen_contact', 'elen_contact_map_embed', __( 'Map embed URL (optional)', 'elen-coffee' ) );
	}

	private static function section_social( $wp_customize ) {
		$wp_customize->add_section( 'elen_social', array(
			'title' => __( 'Social Links', 'elen-coffee' ),
			'panel' => 'elen_content',
		) );

		foreach ( array( 'instagram', 'telegram', 'whatsapp', 'linkedin' ) as $network ) {
			self::text_setting( $wp_customize, 'elen_social', 'elen_social_' . $network, ucfirst( $network ) . ' URL' );
		}
	}

	public static function social_links( $links ) {
		foreach ( array( 'instagram', 'telegram', 'whatsapp', 'linkedin' ) as $network ) {
			$url = get_theme_mod( 'elen_social_' . $network );
			if ( $url ) {
				$links[ ucfirst( $network ) ] = esc_url( $url );
			}
		}
		return $links;
	}
}

ELEN_Customizer::init();
