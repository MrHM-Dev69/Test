<?php
/**
 * Template for a Page with the slug "contact". Form posts to
 * admin-post.php and is handled by ELEN_Contact_Form (nonce + honeypot +
 * time-trap + rate limit + full server-side validation).
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

get_header();

// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only status flag from a redirect, not a state change.
$status  = isset( $_GET['elen_contact'] ) ? sanitize_text_field( wp_unslash( $_GET['elen_contact'] ) ) : '';
// phpcs:ignore WordPress.Security.NonceVerification.Recommended
$bad_fields = isset( $_GET['elen_fields'] ) ? explode( ',', sanitize_text_field( wp_unslash( $_GET['elen_fields'] ) ) ) : array();

$map_embed = get_theme_mod( 'elen_contact_map_embed' );
?>
<main id="primary" class="site-main contact-page">

	<header class="page-header container">
		<h1 class="page-title reveal" data-reveal><?php the_title(); ?></h1>
	</header>

	<div class="container contact-grid">

		<div class="contact-form-wrap reveal" data-reveal>
			<?php if ( 'success' === $status ) : ?>
				<div class="alert alert--success" role="status">
					<?php esc_html_e( 'Thanks — your message has been sent. We\'ll reply within one business day.', 'elen-coffee' ); ?>
				</div>
			<?php elseif ( 'invalid' === $status ) : ?>
				<div class="alert alert--error" role="alert">
					<?php
					if ( in_array( 'rate_limited', $bad_fields, true ) ) {
						esc_html_e( 'Too many messages sent recently. Please try again later.', 'elen-coffee' );
					} else {
						esc_html_e( 'Please check the form — some fields need attention.', 'elen-coffee' );
					}
					?>
				</div>
			<?php endif; ?>

			<form class="contact-form" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" method="post" novalidate>
				<input type="hidden" name="action" value="elen_contact_submit">
				<input type="hidden" name="elen_form_loaded" value="<?php echo esc_attr( time() ); ?>">
				<?php wp_nonce_field( 'elen_contact_submit', 'elen_contact_nonce' ); ?>

				<div class="form-field form-field--honeypot" aria-hidden="true">
					<label for="website">Website</label>
					<input type="text" id="website" name="website" tabindex="-1" autocomplete="off">
				</div>

				<div class="form-field <?php echo in_array( 'name', $bad_fields, true ) ? 'has-error' : ''; ?>">
					<label for="contact-name"><?php esc_html_e( 'Name', 'elen-coffee' ); ?></label>
					<input type="text" id="contact-name" name="name" required autocomplete="name">
					<?php if ( in_array( 'name', $bad_fields, true ) ) : ?><p class="form-field__error"><?php esc_html_e( 'Please enter your name.', 'elen-coffee' ); ?></p><?php endif; ?>
				</div>

				<div class="form-field <?php echo in_array( 'email', $bad_fields, true ) ? 'has-error' : ''; ?>">
					<label for="contact-email"><?php esc_html_e( 'Email', 'elen-coffee' ); ?></label>
					<input type="email" id="contact-email" name="email" required autocomplete="email">
					<?php if ( in_array( 'email', $bad_fields, true ) ) : ?><p class="form-field__error"><?php esc_html_e( 'Please enter a valid email.', 'elen-coffee' ); ?></p><?php endif; ?>
				</div>

				<div class="form-field">
					<label for="contact-subject"><?php esc_html_e( 'Subject', 'elen-coffee' ); ?></label>
					<input type="text" id="contact-subject" name="subject" autocomplete="off">
				</div>

				<div class="form-field <?php echo in_array( 'message', $bad_fields, true ) ? 'has-error' : ''; ?>">
					<label for="contact-message"><?php esc_html_e( 'Message', 'elen-coffee' ); ?></label>
					<textarea id="contact-message" name="message" rows="5" required></textarea>
					<?php if ( in_array( 'message', $bad_fields, true ) ) : ?><p class="form-field__error"><?php esc_html_e( 'Please write a message (at least 10 characters).', 'elen-coffee' ); ?></p><?php endif; ?>
				</div>

				<button type="submit" class="btn btn--primary btn--lg"><?php esc_html_e( 'Send message', 'elen-coffee' ); ?></button>
			</form>
		</div>

		<aside class="contact-details reveal" data-reveal>
			<h2><?php esc_html_e( 'Reach us directly', 'elen-coffee' ); ?></h2>
			<ul class="contact-details__list">
				<?php $phone = get_theme_mod( 'elen_contact_phone' ); ?>
				<?php if ( $phone ) : ?>
					<li><span><?php esc_html_e( 'Phone', 'elen-coffee' ); ?></span><a href="tel:<?php echo esc_attr( preg_replace( '/[^0-9+]/', '', $phone ) ); ?>"><?php echo esc_html( $phone ); ?></a></li>
				<?php endif; ?>
				<?php $email = get_theme_mod( 'elen_contact_email' ); ?>
				<?php if ( $email ) : ?>
					<li><span><?php esc_html_e( 'Email', 'elen-coffee' ); ?></span><a href="mailto:<?php echo esc_attr( $email ); ?>"><?php echo esc_html( $email ); ?></a></li>
				<?php endif; ?>
				<?php $address = get_theme_mod( 'elen_contact_address' ); ?>
				<?php if ( $address ) : ?>
					<li><span><?php esc_html_e( 'Address', 'elen-coffee' ); ?></span><address><?php echo esc_html( $address ); ?></address></li>
				<?php endif; ?>
			</ul>

			<ul class="social-links">
				<?php foreach ( (array) apply_filters( 'elen_social_links', array() ) as $label => $url ) : ?>
					<li><a href="<?php echo esc_url( $url ); ?>" rel="noopener" target="_blank"><?php echo esc_html( $label ); ?></a></li>
				<?php endforeach; ?>
			</ul>

			<?php if ( $map_embed ) : ?>
				<div class="contact-map">
					<iframe src="<?php echo esc_url( $map_embed ); ?>" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="<?php esc_attr_e( 'Map', 'elen-coffee' ); ?>"></iframe>
				</div>
			<?php endif; ?>
		</aside>

	</div>
</main>
<?php
get_footer();
