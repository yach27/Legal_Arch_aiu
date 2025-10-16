import React, { useState, ChangeEvent, FormEvent } from "react";
import ContactLeft from "./ContactLeft";
import Title from "../../../Layouts/Title";

const Contact: React.FC = () => {
    const [username, setUsername] = useState<string>("");
    const [phoneNumber, setPhoneNumber] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [subject, setSubject] = useState<string>("");
    const [message, setMessage] = useState<string>("");
    const [errMsg, setErrMsg] = useState<string>("");
    const [successMsg, setSuccessMsg] = useState<string>("");

    const emailValidation = (): RegExpMatchArray | null => {
        return String(email)
            .toLowerCase()
            .match(/^\w+([-]?\w+)*@\w+([-]?\w+)*(\.\w{2,3})+$/);
    };

    const handleSend = (e: FormEvent<HTMLButtonElement>) => {
        e.preventDefault();

        if (username === "") {
            setErrMsg("Username is required!");
        } else if (phoneNumber === "") {
            setErrMsg("Phone number is required!");
        } else if (email === "") {
            setErrMsg("Please give your Email!");
        } else if (!emailValidation()) {
            setErrMsg("Give a valid Email!");
        } else if (subject === "") {
            setErrMsg("Plese give your Subject!");
        } else if (message === "") {
            setErrMsg("Message is required!");
        } else {
            setSuccessMsg(
                `Thank you dear ${username}, your message has been sent successfully!`,
            );
            setErrMsg("");
            setUsername("");
            setPhoneNumber("");
            setEmail("");
            setSubject("");
            setMessage("");
        }
    };

    return (
        <section
            id="contact"
            className="w-full py-20 bg-white border-b border-gray-300"
        >
            <div className="flex justify-center items-center text-center">
                <Title title="CONTACT" des="Contact With Us" />
            </div>
            <div className="w-full mt-10">
                <div className="w-full flex flex-col lgl:flex-row justify-between gap-6">
                    <ContactLeft />
                    <div className="w-full lgl:w-[60%] h-full p-4 lgl:p-8 bg-white rounded-lg shadow-lg border border-gray-200">
                        <form className="w-full flex flex-col gap-6">
                            {(errMsg || successMsg) && (
                                <p
                                    className={`py-3 text-center text-base tracking-wide ${
                                        errMsg
                                            ? "text-red-500"
                                            : "text-green-600"
                                    }`}
                                >
                                    {errMsg || successMsg}
                                </p>
                            )}

                            <div className="w-full flex flex-col lgl:flex-row gap-6">
                                <div className="text-3xl font-bold text-black">
                                    Send Message !!{" "}
                                </div>
                                <div className="w-full lgl:w-1/2 flex flex-col gap-2">
                                    <label className="text-sm text-gray-700 uppercase">
                                        Your name
                                    </label>
                                    <input
                                        onChange={(
                                            e: ChangeEvent<HTMLInputElement>,
                                        ) => setUsername(e.target.value)}
                                        value={username}
                                        className={`contactInput bg-white border border-gray-300 rounded-md p-3 ${
                                            errMsg ===
                                                "Username is required!" &&
                                            "border-red-500"
                                        }`}
                                        type="text"
                                    />
                                </div>
                                <div className="w-full lgl:w-1/2 flex flex-col gap-2">
                                    <label className="text-sm text-gray-700 uppercase">
                                        Phone Number
                                    </label>
                                    <input
                                        onChange={(
                                            e: ChangeEvent<HTMLInputElement>,
                                        ) => setPhoneNumber(e.target.value)}
                                        value={phoneNumber}
                                        className={`contactInput bg-white border border-gray-300 rounded-md p-3 ${
                                            errMsg ===
                                                "Phone number is required!" &&
                                            "border-red-500"
                                        }`}
                                        type="text"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm text-gray-700 uppercase">
                                    Email
                                </label>
                                <input
                                    onChange={(
                                        e: ChangeEvent<HTMLInputElement>,
                                    ) => setEmail(e.target.value)}
                                    value={email}
                                    className={`contactInput bg-white border border-gray-300 rounded-md p-3 ${
                                        errMsg === "Please give your Email!" &&
                                        "border-red-500"
                                    }`}
                                    type="email"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm text-gray-700 uppercase">
                                    Subject
                                </label>
                                <input
                                    onChange={(
                                        e: ChangeEvent<HTMLInputElement>,
                                    ) => setSubject(e.target.value)}
                                    value={subject}
                                    className={`contactInput bg-white border border-gray-300 rounded-md p-3 ${
                                        errMsg === "Plese give your Subject!" &&
                                        "border-red-500"
                                    }`}
                                    type="text"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm text-gray-700 uppercase">
                                    Message
                                </label>
                                <textarea
                                    onChange={(
                                        e: ChangeEvent<HTMLTextAreaElement>,
                                    ) => setMessage(e.target.value)}
                                    value={message}
                                    className={`contactTextArea bg-white border border-gray-300 rounded-md p-3 ${
                                        errMsg === "Message is required!" &&
                                        "border-red-500"
                                    }`}
                                    rows={6}
                                />
                            </div>

                            <div className="w-full">
                                <button
                                    onClick={handleSend}
                                    className="w-full h-12 bg-[#00491e] text-white rounded-md text-base tracking-wide hover:bg-[#ffc600] hover:text-black transition duration-300"
                                >
                                    Send Message
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Contact;
