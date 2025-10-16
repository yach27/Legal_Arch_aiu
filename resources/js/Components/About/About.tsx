import { FaMobile, FaGlobe } from "react-icons/fa";
import { SiAntdesign } from "react-icons/si";
import { BsBuildingFillCheck } from "react-icons/bs";
import { MdOutlineAdminPanelSettings } from "react-icons/md";
import { FaRobot, FaFileAlt, FaSearch } from "react-icons/fa";
import { BiMessageSquareDetail } from "react-icons/bi";
import { HiDocumentText } from "react-icons/hi";
import { AiOutlineFileSearch } from "react-icons/ai";
import Title from "../../../Layouts/Title";
import Card from "./Card";

const About = () => {
    return (
        <section
            id="about"
            className="w-full py-10 px-6 lg:px-10 bg-white border-b-[1px] border-b-gray-200"
        >
            {/* Office Introduction */}
            <Title
                title="About the Office"
                des="Legal Office and Document Management Services"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 xl:gap-10 mb-16">
                <Card
                    title="Legal Documentation"
                    des="Comprehensive management of legal documents, contracts, policies, and regulatory compliance materials with secure storage and version control."
                    icon={<HiDocumentText />}
                />
                <Card
                    title="Document Archiving"
                    des="Professional archiving services for legal records, case files, and administrative documents with organized categorization and retrieval systems."
                    icon={<FaFileAlt />}
                />
                <Card
                    title="Legal Compliance"
                    des="Ensuring all documentation meets legal standards and regulatory requirements while maintaining confidentiality and data protection protocols."
                    icon={<BsBuildingFillCheck />}
                />
            </div>

            {/* System Features */}
            <Title
                title="About the System"
                des="AI-Powered Document Management Features"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 xl:gap-10">
                <Card
                    title="AI Document Reading"
                    des="Advanced AI technology automatically reads, processes, and extracts key information from legal documents, contracts, and case files with high accuracy."
                    icon={<FaRobot />}
                />
                <Card
                    title="Intelligent Retrieval"
                    des="Smart search capabilities that understand context and legal terminology to quickly locate specific documents, clauses, or information across the entire archive."
                    icon={<AiOutlineFileSearch />}
                />
                <Card
                    title="AI Conversation Interface"
                    des="Natural language interaction with the system - ask questions about documents in plain English and receive precise answers with source references."
                    icon={<BiMessageSquareDetail />}
                />
                <Card
                    title="Mobile-Friendly Access"
                    des="Secure mobile access to the legal archive system, allowing authorized personnel to search and retrieve documents from anywhere, anytime."
                    icon={<FaMobile />}
                />
                <Card
                    title="Intuitive User Interface"
                    des="Clean, professional design optimized for legal professionals with streamlined workflows and easy navigation through complex document hierarchies."
                    icon={<SiAntdesign />}
                />
                <Card
                    title="Web-Based Platform"
                    des="Cloud-based system accessible through web browsers with enterprise-grade security, backup systems, and multi-user collaboration features."
                    icon={<FaGlobe />}
                />
            </div>
        </section>
    );
};

export default About;
