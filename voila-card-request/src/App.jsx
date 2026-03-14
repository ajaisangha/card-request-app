import { useMemo, useState } from "react";
import axios from "axios";

const initialState = {
  location: "Vaughn CFC",
  authFirstName: "",
  authLastName: "",
  authDate: new Date().toISOString().slice(0, 10),
  authTitle: "",
  typeOfCard: "Permanent",
  requestingUserGroup: "Operations",
  employeeNumber: "",
  firstName: "",
  lastName: "",
  addRemove: "ADD",
  recipientEmails: "",
};

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  required = false,
  options,
  textarea = false,
}) {
  return (
    <div className="field">
      <label htmlFor={name}>
        {label} {required ? <span className="req">*</span> : null}
      </label>

      {textarea ? (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          rows="3"
          placeholder="Multiple emails separated by commas or new lines&#10;e.g. user1@example.com, user2@example.com"
        />
      ) : options ? (
        <select id={name} name={name} value={value} onChange={onChange}>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          required={required}
          pattern={name === "employeeNumber" ? "\\d+" : undefined}
          inputMode={name === "employeeNumber" ? "numeric" : undefined}
        />
      )}
    </div>
  );
}

export default function App() {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handheldSignOnName = useMemo(
    () =>
      form.firstName.trim() && form.lastName.trim()
        ? `${form.firstName.trim().toLowerCase()}.${form.lastName
            .trim()
            .toLowerCase()}`
        : "",
    [form.firstName, form.lastName]
  );

  const canSubmit = useMemo(() => {
    return (
      form.authFirstName.trim() &&
      form.authLastName.trim() &&
      form.authDate &&
      form.authTitle.trim() &&
      form.employeeNumber.trim() &&
      /^\d+$/.test(form.employeeNumber) &&
      form.firstName.trim() &&
      form.lastName.trim() &&
      handheldSignOnName &&
      form.recipientEmails.trim()
    );
  }, [form, handheldSignOnName]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!canSubmit) {
      setMessage("Please fill all required fields correctly.");
      return;
    }

    try {
      setLoading(true);

      const emailList = form.recipientEmails
        .split(/[\n,]+/)
        .map((email) => email.trim())
        .filter(Boolean)
        .join(",");

      const { data } = await axios.post("/api/send-card-request", {
        ...form,
        handheldSignOnName,
        recipientEmails: emailList,
      });

      setMessage(data.message || "Email sent successfully.");
      setForm({
        ...initialState,
        authDate: new Date().toISOString().slice(0, 10),
      });
    } catch (error) {
      console.error("Submit error:", error);

      if (error.response) {
        setMessage(
          error.response.data?.message ||
            `Request failed with status ${error.response.status}.`
        );
      } else if (error.request) {
        setMessage("Backend not reachable. Make sure npm run server is running.");
      } else {
        setMessage(error.message || "Failed to send email.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="container">
        <div className="hero">
          <div>
            <p className="eyebrow">Voila</p>
            <h1>Access Card Request Form</h1>
            <p className="subtext">
              Fill the form below and send it as an Excel attachment by email.
            </p>
          </div>
        </div>

        <form className="form-card" onSubmit={handleSubmit}>
          <section className="group">
            <h2>Location Group</h2>
            <div className="grid">
              <Field
                label="Location"
                name="location"
                value={form.location}
                onChange={handleChange}
                options={["Vaughn CFC", "Etobicoke spoke"]}
              />
            </div>
          </section>

          <section className="group">
            <h2>Under Authorization</h2>
            <div className="grid">
              <Field
                label="First Name"
                name="authFirstName"
                value={form.authFirstName}
                onChange={handleChange}
                required
              />
              <Field
                label="Last Name"
                name="authLastName"
                value={form.authLastName}
                onChange={handleChange}
                required
              />
              <Field
                label="Date"
                name="authDate"
                type="date"
                value={form.authDate}
                onChange={handleChange}
                required
              />
              <Field
                label="Title"
                name="authTitle"
                value={form.authTitle}
                onChange={handleChange}
                required
              />
            </div>
          </section>

          <section className="group">
            <h2>Type of Card</h2>
            <div className="grid">
              <Field
                label="Type of Card Requested"
                name="typeOfCard"
                value={form.typeOfCard}
                onChange={handleChange}
                options={["Permanent", "Replacement", "Temporary"]}
              />
            </div>
          </section>

          <section className="group">
            <h2>Requesting User Group</h2>
            <div className="grid">
              <Field
                label="Requesting User Group"
                name="requestingUserGroup"
                value={form.requestingUserGroup}
                onChange={handleChange}
                options={["Operations", "Delivery", "Ocado", "Driver", "3rd Party"]}
              />
            </div>
          </section>

          <section className="group">
            <h2>Card Being Issued To</h2>
            <div className="grid">
              <Field
                label="Employee Number"
                name="employeeNumber"
                type="text"
                value={form.employeeNumber}
                onChange={handleChange}
                required
              />
              <Field
                label="First Name"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                required
              />
              <Field
                label="Last Name"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                required
              />
              <div className="field">
                <label>Handheld Sign On Name</label>
                <div className="preview-field">
                  {handheldSignOnName || "firstname.lastname"}
                </div>
                <small>Auto-generated from First Name + Last Name</small>
              </div>
              <Field
                label="Add / Remove"
                name="addRemove"
                value={form.addRemove}
                onChange={handleChange}
                options={["ADD", "REMOVE"]}
              />
              <Field
                label="Send To Emails"
                name="recipientEmails"
                value={form.recipientEmails}
                onChange={handleChange}
                textarea
                required
              />
            </div>
          </section>

          <div className="actions">
            <button type="submit" disabled={loading || !canSubmit}>
              {loading ? "Sending..." : "Send Excel Attachment"}
            </button>
          </div>

          {message ? <p className="message">{message}</p> : null}
        </form>
      </div>
    </div>
  );
}
