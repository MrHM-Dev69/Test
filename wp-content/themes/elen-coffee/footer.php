<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>
	<footer class="site-footer">
		<div class="container site-footer__grid">
			<div class="site-footer__brand">
				<p class="site-footer__logo"><?php bloginfo( 'name' ); ?></p>
				<p class="site-footer__tagline"><?php esc_html_e( 'Specialty coffee, roasted small-batch.', 'elen-coffee' ); ?></p>
				<ul class="social-links">
					<?php foreach ( (array) apply_filters( 'elen_social_links', array() ) as $label => $url ) : ?>
						<li><a href="<?php echo esc_url( $url ); ?>" rel="noopener" target="_blank"><?php echo esc_html( $label ); ?></a></li>
					<?php endforeach; ?>
				</ul>
			</div>

			<nav class="site-footer__nav" aria-label="<?php esc_attr_e( 'Footer', 'elen-coffee' ); ?>">
				<?php
				wp_nav_menu(
					array(
						'theme_location' => 'footer',
						'container'      => false,
						'menu_class'     => 'site-footer__list',
						'fallback_cb'    => false,
					)
				);
				?>
			</nav>

			<div class="site-footer__newsletter">
				<h3><?php esc_html_e( 'Stay in the loop', 'elen-coffee' ); ?></h3>
				<p><?php esc_html_e( 'New arrivals, roast notes, and brewing guides — no spam.', 'elen-coffee' ); ?></p>
				<form class="newsletter-form" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" method="post">
					<input type="hidden" name="action" value="elen_newsletter_subscribe">
					<?php wp_nonce_field( 'elen_newsletter', 'elen_newsletter_nonce' ); ?>
					<label class="sr-only" for="newsletter-email"><?php esc_html_e( 'Email address', 'elen-coffee' ); ?></label>
					<input type="email" id="newsletter-email" name="email" required placeholder="<?php esc_attr_e( 'you@example.com', 'elen-coffee' ); ?>">
					<button type="submit" class="btn btn--primary"><?php esc_html_e( 'Subscribe', 'elen-coffee' ); ?></button>
				</form>
			</div>
		</div>

		<div class="site-footer__legal container">
			<nav aria-label="<?php esc_attr_e( 'Legal', 'elen-coffee' ); ?>">
				<?php
				wp_nav_menu(
					array(
						'theme_location' => 'legal',
						'container'      => false,
						'menu_class'     => 'legal-links',
						'fallback_cb'    => false,
					)
				);
				?>
			</nav>
			<p>&copy; <?php echo esc_html( gmdate( 'Y' ) ); ?> <?php bloginfo( 'name' ); ?>. <?php esc_html_e( 'All rights reserved.', 'elen-coffee' ); ?></p>
		</div>
	</footer>

<?php wp_footer(); ?>
</body>
</html>
