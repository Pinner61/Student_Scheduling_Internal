# Contact form

The review page includes the fields from the live PROPEL webform:

| Label | Name | Limit |
| --- | --- | --- |
| First name | `first_name` | 255 |
| Last name | `last_name` | 255 |
| Email | `email` | 254 |
| Message | `message` | 5000 |

The live form is a Drupal webform:

- Form id: `webform_submission_propel_block_content_3371_add_form`
- Action: `POST /propel` on `universitycollege.asu.edu`
- It also posts Drupal’s `form_build_id` and `form_id`

This prototype cannot mint a Drupal form token, and it does not post to the live site. A valid submit says the message was not sent unless `data-form-endpoint` is set on the mount element.

```html
<div
  class="propel"
  data-propel-journey
  data-show-chrome="false"
  data-form-endpoint="/approved-propel-receiver"
></div>
```

The script posts `FormData` with the four field names above and treats the message as delivered only when that endpoint returns a successful HTTP status. The endpoint has to store the message before it returns success. Pointing `data-form-endpoint` at the public PROPEL URL will not work: the request is cross-origin and Drupal will reject it without `form_build_id`.

On the University College site, the durable integration is to keep the existing webform and restyle it, or to submit through a same-origin Drupal route that creates a webform submission. A hidden `company` field is a honeypot. If it is filled, the message is rejected and is not described as delivered.

No API key, mailbox, or Drupal credential is stored in this repository.
