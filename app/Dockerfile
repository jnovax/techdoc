FROM quay.io/hedgedoc/hedgedoc:1.12.0

USER root

# Copy customized source files and assets
COPY --chown=hedgedoc:hedgedoc app.js /hedgedoc/app.js
COPY --chown=hedgedoc:hedgedoc lib/ /hedgedoc/lib/
COPY --chown=hedgedoc:hedgedoc public/ /hedgedoc/public/
COPY --chown=hedgedoc:hedgedoc locales/ /hedgedoc/locales/

USER hedgedoc

EXPOSE 3000

CMD ["node", "app.js"]
